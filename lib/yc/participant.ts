import { prisma } from '@/lib/prisma'
import type { YcParticipantPublic, YcParticipantIndividualPoints } from './types'
import type { ServiceInterest } from './constants'
import { YC_SIPALING_EXTROVERT_SLUG, YC_TUKANG_NGONTEN_SLUG } from './constants'

function formatChurch(raw: string | null): string | null {
  if (!raw) return null
  return raw.startsWith('GPdI') ? raw : `GPdI ${raw}`
}

export async function getParticipantByToken(token: string) {
  return prisma.ycParticipant.findUnique({
    where: { token },
    include: {
      group: {
        include: {
          captain: { select: { id: true, name: true } },
          contentCreator: { select: { id: true, name: true } },
          participants: { select: { id: true, name: true, token: true } },
        },
      },
    },
  })
}

type ParticipantRow = {
  id: string
  token: string
  name: string | null
  gender: 'MALE' | 'FEMALE' | null
  churchName: string | null
  instagram: string | null
  tiktok: string | null
  serviceInterest: unknown
  group: {
    id: string
    name: string
    slug: string
    points: number
  } | null
}

export function toParticipantPublic(p: ParticipantRow): YcParticipantPublic {
  const interests = Array.isArray(p.serviceInterest)
    ? (p.serviceInterest as ServiceInterest[])
    : null

  return {
    id: p.id,
    token: p.token,
    name: p.name,
    gender: p.gender,
    churchName: p.churchName,
    church: formatChurch(p.churchName),
    instagram: p.instagram,
    tiktok: p.tiktok,
    serviceInterest: interests,
    group: p.group
      ? {
          id: p.group.id,
          name: p.group.name,
          slug: p.group.slug,
          points: p.group.points,
        }
      : null,
  }
}

export async function requireParticipant(token: string) {
  const participant = await getParticipantByToken(token)
  if (!participant) return null
  return participant
}

export function isGroupContentCreator(participant: {
  id: string
  group: { contentCreator: { id: string } | null } | null
}): boolean {
  return participant.group?.contentCreator?.id === participant.id
}

/** Personal upload + extrovert story points (not kelompok leaderboard). */
export async function getParticipantIndividualPoints(
  participantId: string,
): Promise<YcParticipantIndividualPoints> {
  const [uploadAgg, extrovertAgg] = await Promise.all([
    prisma.ycChallengeSubmission.aggregate({
      where: {
        participantId,
        groupId: null,
        status: 'APPROVED',
        challenge: { slug: YC_TUKANG_NGONTEN_SLUG },
      },
      _sum: { pointsAwarded: true },
    }),
    prisma.ycNametagStory.aggregate({
      where: {
        authorParticipantId: participantId,
        pairing: { status: 'COMPLETED', challenge: { slug: YC_SIPALING_EXTROVERT_SLUG } },
      },
      _sum: { pointsAwarded: true },
    }),
  ])

  const upload = uploadAgg._sum.pointsAwarded ?? 0
  const extrovert = extrovertAgg._sum.pointsAwarded ?? 0
  return { upload, extrovert, total: upload + extrovert }
}
