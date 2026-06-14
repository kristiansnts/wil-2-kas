import { prisma } from '@/lib/prisma'
import { YC_NAMETAG_MIN_CHARS, YC_SIPALING_EXTROVERT_SLUG } from './constants'
import { pointsFromCharCount } from './nametag-scoring'
import type { NametagPairingView } from './types'

export { pointsFromCharCount }
export type { NametagPairingView }

export function canonicalParticipantPair(aId: string, bId: string) {
  return aId < bId
    ? { lowId: aId, highId: bId }
    : { lowId: bId, highId: aId }
}

export function partnerParticipantId(
  pairing: { participantLowId: string; participantHighId: string },
  selfId: string,
): string | null {
  if (pairing.participantLowId === selfId) return pairing.participantHighId
  if (pairing.participantHighId === selfId) return pairing.participantLowId
  return null
}

type PartnerInfo = {
  id: string
  name: string | null
  churchName: string | null
}

export async function getExtrovertChallenge() {
  return prisma.ycChallenge.findUnique({ where: { slug: YC_SIPALING_EXTROVERT_SLUG } })
}

export async function findCompletedPairing(challengeId: string, aId: string, bId: string) {
  const { lowId, highId } = canonicalParticipantPair(aId, bId)
  return prisma.ycNametagPairing.findUnique({
    where: {
      challengeId_participantLowId_participantHighId: {
        challengeId,
        participantLowId: lowId,
        participantHighId: highId,
      },
    },
  })
}

export async function getOpenPairingForParticipant(participantId: string, challengeId: string) {
  return prisma.ycNametagPairing.findFirst({
    where: {
      challengeId,
      status: 'OPEN',
      OR: [{ participantLowId: participantId }, { participantHighId: participantId }],
    },
    include: {
      participantLow: { select: { id: true, name: true, churchName: true } },
      participantHigh: { select: { id: true, name: true, churchName: true } },
      stories: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

function toPairingView(
  pairing: {
    id: string
    status: 'OPEN' | 'COMPLETED'
    participantLow: PartnerInfo
    participantHigh: PartnerInfo
    participantLowId: string
    participantHighId: string
    stories: {
      authorParticipantId: string
      storyText: string
      charCount: number
      pointsAwarded: number
    }[]
    completedAt: Date | null
  },
  selfId: string,
): NametagPairingView {
  const partner =
    pairing.participantLowId === selfId ? pairing.participantHigh : pairing.participantLow
  const myStory = pairing.stories.find(s => s.authorParticipantId === selfId)
  const partnerStory = pairing.stories.find(s => s.authorParticipantId === partner.id)

  return {
    id: pairing.id,
    status: pairing.status,
    partner: {
      id: partner.id,
      name: partner.name,
      churchName: partner.churchName,
    },
    myStorySubmitted: !!myStory,
    partnerStorySubmitted: !!partnerStory,
    myStoryText: myStory?.storyText ?? null,
    myCharCount: myStory?.charCount ?? null,
    myPointsAwarded: myStory?.pointsAwarded ?? null,
    partnerPointsAwarded: partnerStory?.pointsAwarded ?? null,
    completedAt: pairing.completedAt?.toISOString() ?? null,
  }
}

export async function buildNametagStatus(participantId: string) {
  const challenge = await getExtrovertChallenge()
  if (!challenge?.isActive) {
    return { challengeActive: false as const }
  }

  const openPairing = await getOpenPairingForParticipant(participantId, challenge.id)

  const completedStories = await prisma.ycNametagStory.findMany({
    where: {
      authorParticipantId: participantId,
      pairing: { challengeId: challenge.id, status: 'COMPLETED' },
    },
    select: { pointsAwarded: true },
  })

  const totalPointsEarned = completedStories.reduce((sum, s) => sum + s.pointsAwarded, 0)

  return {
    challengeActive: true as const,
    challengeSlug: challenge.slug,
    challengeTitle: challenge.title,
    openPairing: openPairing ? toPairingView(openPairing, participantId) : null,
    pairingCount: completedStories.length,
    totalPointsEarned,
  }
}

export async function scanNametagPairing(
  scannerId: string,
  scannedToken: string,
): Promise<{ ok: true; pairing: NametagPairingView } | { error: string }> {
  const challenge = await getExtrovertChallenge()
  if (!challenge?.isActive) return { error: 'Challenge tidak aktif' }

  const scanner = await prisma.ycParticipant.findUnique({ where: { id: scannerId } })
  if (!scanner?.name) return { error: 'Lengkapi registrasi dulu' }

  const partner = await prisma.ycParticipant.findUnique({ where: { token: scannedToken } })
  if (!partner) return { error: 'QR name tag tidak dikenali' }
  if (partner.isComitee) return { error: 'Tidak bisa scan QR panitia' }
  if (!partner.name) return { error: 'Peserta belum registrasi' }
  if (partner.id === scannerId) return { error: 'Tidak bisa scan name tag sendiri' }

  const existing = await findCompletedPairing(challenge.id, scannerId, partner.id)
  if (existing?.status === 'COMPLETED') {
    return { error: 'Kamu sudah pernah ngobrol dengan orang ini' }
  }

  const scannerOpen = await getOpenPairingForParticipant(scannerId, challenge.id)
  if (scannerOpen && !isPairingWith(scannerOpen, partner.id)) {
    return { error: 'Selesaikan ngobrol dengan pasangan saat ini dulu' }
  }

  const partnerOpen = await getOpenPairingForParticipant(partner.id, challenge.id)
  if (partnerOpen && !isPairingWith(partnerOpen, scannerId)) {
    return { error: 'Peserta sedang ngobrol dengan orang lain' }
  }

  const { lowId, highId } = canonicalParticipantPair(scannerId, partner.id)

  let pairing = await prisma.ycNametagPairing.findUnique({
    where: {
      challengeId_participantLowId_participantHighId: {
        challengeId: challenge.id,
        participantLowId: lowId,
        participantHighId: highId,
      },
    },
    include: {
      participantLow: { select: { id: true, name: true, churchName: true } },
      participantHigh: { select: { id: true, name: true, churchName: true } },
      stories: true,
    },
  })

  if (!pairing) {
    pairing = await prisma.ycNametagPairing.create({
      data: {
        challengeId: challenge.id,
        participantLowId: lowId,
        participantHighId: highId,
        initiatedByParticipantId: scannerId,
      },
      include: {
        participantLow: { select: { id: true, name: true, churchName: true } },
        participantHigh: { select: { id: true, name: true, churchName: true } },
        stories: true,
      },
    })
  } else if (pairing.status === 'COMPLETED') {
    return { error: 'Kamu sudah pernah ngobrol dengan orang ini' }
  }

  return { ok: true, pairing: toPairingView(pairing, scannerId) }
}

function isPairingWith(
  pairing: { participantLowId: string; participantHighId: string },
  participantId: string,
) {
  return pairing.participantLowId === participantId || pairing.participantHighId === participantId
}

export async function submitNametagStory(
  participantId: string,
  storyText: string,
): Promise<
  | {
      ok: true
      waitingForPartner: boolean
      pointsAwarded: number | null
      charCount: number
      pairing: NametagPairingView
    }
  | { error: string }
> {
  const challenge = await getExtrovertChallenge()
  if (!challenge?.isActive) return { error: 'Challenge tidak aktif' }

  const trimmed = storyText.trim()
  const charCount = trimmed.length
  if (charCount < YC_NAMETAG_MIN_CHARS) {
    return { error: `Cerita minimal ${YC_NAMETAG_MIN_CHARS} karakter` }
  }

  const pairing = await getOpenPairingForParticipant(participantId, challenge.id)
  if (!pairing) return { error: 'Tidak ada sesi ngobrol aktif' }

  const existingStory = pairing.stories.find(s => s.authorParticipantId === participantId)
  if (existingStory) return { error: 'Kamu sudah mengirim cerita untuk sesi ini' }

  const partnerId = partnerParticipantId(pairing, participantId)
  if (!partnerId) return { error: 'Pasangan tidak valid' }

  const story = await prisma.ycNametagStory.create({
    data: {
      pairingId: pairing.id,
      authorParticipantId: participantId,
      storyText: trimmed,
      charCount,
    },
  })

  const refreshed = await prisma.ycNametagPairing.findUnique({
    where: { id: pairing.id },
    include: {
      participantLow: { select: { id: true, name: true, churchName: true } },
      participantHigh: { select: { id: true, name: true, churchName: true } },
      stories: true,
    },
  })
  if (!refreshed) return { error: 'Sesi tidak ditemukan' }

  if (refreshed.stories.length < 2) {
    return {
      ok: true,
      waitingForPartner: true,
      pointsAwarded: null,
      charCount: story.charCount,
      pairing: toPairingView(refreshed, participantId),
    }
  }

  const pointsAwarded = await completeNametagPairing(refreshed, challenge.id)
  const myPoints = pointsAwarded.find(p => p.participantId === participantId)?.points ?? null

  const completed = await prisma.ycNametagPairing.findUnique({
    where: { id: pairing.id },
    include: {
      participantLow: { select: { id: true, name: true, churchName: true } },
      participantHigh: { select: { id: true, name: true, churchName: true } },
      stories: true,
    },
  })
  if (!completed) return { error: 'Sesi tidak ditemukan' }

  return {
    ok: true,
    waitingForPartner: false,
    pointsAwarded: myPoints,
    charCount: story.charCount,
    pairing: toPairingView(completed, participantId),
  }
}

async function completeNametagPairing(
  pairing: {
    id: string
    participantLowId: string
    participantHighId: string
    stories: { id: string; authorParticipantId: string; storyText: string; charCount: number }[]
  },
  challengeId: string,
) {
  const challenge = await prisma.ycChallenge.findUnique({ where: { id: challengeId } })
  if (!challenge) throw new Error('Challenge tidak ditemukan')

  const awards: { participantId: string; points: number }[] = []

  await prisma.$transaction(async tx => {
    for (const story of pairing.stories) {
      const points = pointsFromCharCount(story.charCount)
      const author = await tx.ycParticipant.findUnique({
        where: { id: story.authorParticipantId },
        select: { id: true, groupId: true },
      })
      if (!author) continue

      const partnerId = partnerParticipantId(pairing, author.id)
      const partner = partnerId
        ? await tx.ycParticipant.findUnique({
            where: { id: partnerId },
            select: { name: true, churchName: true },
          })
        : null

      const submission = await tx.ycChallengeSubmission.create({
        data: {
          challengeId,
          participantId: author.id,
          answerText: `[Cerita tentang ${partner?.name ?? 'pasangan'}${partner?.churchName ? ` (${partner.churchName})` : ''}]\n\n${story.storyText}`,
          status: 'APPROVED',
          pointsAwarded: points,
          reviewedAt: new Date(),
        },
      })

      await tx.ycNametagStory.update({
        where: { id: story.id },
        data: { pointsAwarded: points, submissionId: submission.id },
      })

      if (author.groupId) {
        await tx.ycGroup.update({
          where: { id: author.groupId },
          data: { points: { increment: points } },
        })
      }

      awards.push({ participantId: author.id, points })
    }

    await tx.ycNametagPairing.update({
      where: { id: pairing.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  })

  return awards
}

export async function getActiveNametagInvite(participantId: string) {
  const status = await buildNametagStatus(participantId)
  if (!status.challengeActive || !status.openPairing) {
    return { active: false as const }
  }

  if (status.openPairing.myStorySubmitted && status.openPairing.partnerStorySubmitted) {
    return { active: false as const }
  }

  return {
    active: true as const,
    challengeSlug: status.challengeSlug,
    challengeTitle: status.challengeTitle,
    partnerName: status.openPairing.partner.name ?? 'Peserta',
    pairingId: status.openPairing.id,
    needsStory: !status.openPairing.myStorySubmitted,
  }
}
