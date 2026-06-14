import { prisma } from '@/lib/prisma'
import ChallengeListClient from '@/components/yc/participant/ChallengeListClient'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { YC_SIPALING_EXTROVERT_SLUG, YC_TUKANG_NGONTEN_SLUG } from '@/lib/yc/constants'

type Props = { params: Promise<{ token: string }> }

export default async function ChallengeListPage({ params }: Props) {
  const { token } = await params
  const participant = await requireParticipantPage(token)

  const challenges = await prisma.ycChallenge.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { title: 'asc' }],
  })

  const submissions = await prisma.ycChallengeSubmission.findMany({
    where: {
      OR: [
        { participantId: participant.id },
        ...(participant.groupId ? [{ groupId: participant.groupId }] : []),
      ],
    },
  })

  const teamSessions = participant.groupId
    ? await prisma.ycTeamChallengeSession.findMany({ where: { groupId: participant.groupId } })
    : []

  const nametagStories = await prisma.ycNametagStory.findMany({
    where: {
      authorParticipantId: participant.id,
      pairing: { status: 'COMPLETED' },
    },
    select: { pointsAwarded: true, pairing: { select: { challengeId: true } } },
  })

  const items = challenges.map(c => {
    const isDocChallenge = c.slug === YC_TUKANG_NGONTEN_SLUG
    const isExtrovertChallenge = c.slug === YC_SIPALING_EXTROVERT_SLUG
    const challengeSubs = submissions.filter(s => s.challengeId === c.id && s.status === 'APPROVED')
    const sub = submissions.find(s => s.challengeId === c.id)
    const session = teamSessions.find(s => s.challengeId === c.id)

    const myUploads = challengeSubs.filter(s => s.participantId === participant.id)
    const personalUploads = myUploads.filter(s => !s.groupId)
    const groupUploads = myUploads.filter(s => s.groupId)
    const totalPointsEarned = personalUploads.reduce((sum, s) => sum + s.pointsAwarded, 0)

    const extrovertStories = nametagStories.filter(s => s.pairing.challengeId === c.id)
    const extrovertPoints = extrovertStories.reduce((sum, s) => sum + s.pointsAwarded, 0)

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      type: c.type as 'INDIVIDUAL' | 'TEAM',
      description: c.description,
      points: c.points,
      isActive: c.isActive,
      completed: isDocChallenge || isExtrovertChallenge
        ? false
        : c.type === 'INDIVIDUAL'
          ? sub?.status === 'APPROVED'
          : session?.status === 'COMPLETED',
      submissionStatus: isDocChallenge
        ? myUploads.length > 0
          ? [
              personalUploads.length > 0 && `${personalUploads.length} individu · +${totalPointsEarned}`,
              groupUploads.length > 0 && `${groupUploads.length} kelompok`,
            ]
              .filter(Boolean)
              .join(' · ')
          : null
        : isExtrovertChallenge
          ? extrovertStories.length > 0
            ? `${extrovertStories.length} pasangan · +${extrovertPoints}`
            : null
          : (sub?.status ?? null),
      isDocumentationChallenge: isDocChallenge,
      isExtrovertChallenge,
      uploadCount: isDocChallenge ? myUploads.length : undefined,
      totalPointsEarned: isDocChallenge ? totalPointsEarned : isExtrovertChallenge ? extrovertPoints : undefined,
    }
  })

  return <ChallengeListClient token={token} challenges={items} />
}
