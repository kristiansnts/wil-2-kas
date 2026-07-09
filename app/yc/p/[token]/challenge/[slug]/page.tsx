import { notFound, redirect } from 'next/navigation'
import ChallengeDetailClient from '@/components/yc/participant/ChallengeDetailClient'
import ExtrovertChallengeClient from '@/components/yc/participant/ExtrovertChallengeClient'
import OutboundChallengeClient from '@/components/yc/participant/OutboundChallengeClient'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { prisma } from '@/lib/prisma'
import { YC_OUTBOUND_SLUG, YC_SIPALING_EXTROVERT_SLUG, YC_TUKANG_NGONTEN_SLUG } from '@/lib/yc/constants'
import { getParticipantFeatureFlags, isTeamChallengeSlug } from '@/lib/yc/features'
import { getFragmentProgress } from '@/lib/yc/emergency'
import { buildNametagStatus } from '@/lib/yc/extrovert'

type Props = { params: Promise<{ token: string; slug: string }> }

export default async function ChallengeDetailPage({ params }: Props) {
  const { token, slug } = await params
  const [participant, features] = await Promise.all([
    requireParticipantPage(token),
    getParticipantFeatureFlags(),
  ])

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || !challenge.isActive) notFound()
  if (isTeamChallengeSlug(slug) && !features.teamChallenge) notFound()
  if (slug === YC_SIPALING_EXTROVERT_SLUG && !features.nametagPairing) notFound()

  if (slug === YC_TUKANG_NGONTEN_SLUG) {
    redirect(`/yc/p/${token}/dokumentasi`)
  }

  if (slug === YC_OUTBOUND_SLUG) {
    return (
      <OutboundChallengeClient
        token={token}
        challenge={{
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
        }}
      />
    )
  }

  if (slug === YC_SIPALING_EXTROVERT_SLUG) {
    const nametagStatus = await buildNametagStatus(participant.id)
    if (!nametagStatus.challengeActive) notFound()

    return (
      <ExtrovertChallengeClient
        token={token}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
        }}
        initialStatus={{
          openPairing: nametagStatus.openPairing,
          pairingCount: nametagStatus.pairingCount,
          totalPointsEarned: nametagStatus.totalPointsEarned,
        }}
      />
    )
  }

  let teamStatus: string | null = null
  let fragmentsRecovered = 0
  let fragmentsTotal = 0
  if (isTeamChallengeSlug(slug) && participant.groupId) {
    const session = await prisma.ycTeamChallengeSession.findUnique({
      where: { groupId_challengeId: { groupId: participant.groupId, challengeId: challenge.id } },
    })
    teamStatus = session?.status ?? null
    const progress = await getFragmentProgress(participant.groupId, challenge.id)
    fragmentsRecovered = progress.recovered
    fragmentsTotal = progress.total
  }

  return (
    <ChallengeDetailClient
      token={token}
      showEmergencyAlarm={features.emergencyAlarm}
      challenge={{
        slug: challenge.slug,
        title: challenge.title,
        type: challenge.type,
        description: challenge.description,
        points: challenge.points,
        teamStatus,
        fragmentsRecovered,
        fragmentsTotal,
      }}
    />
  )
}
