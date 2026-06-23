import { notFound } from 'next/navigation'
import ScanConfirmPanel from '@/components/yc/participant/ScanConfirmPanel'
import { FormShell } from '@/components/forms/FormShell'
import { getParticipantFeatureFlags, isTeamChallengeSlug } from '@/lib/yc/features'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { prisma } from '@/lib/prisma'
import { buildEmergencyStatus } from '@/lib/yc/emergency'

type Props = { params: Promise<{ token: string; slug: string; qrCode: string }> }

export default async function ChallengeScanPage({ params }: Props) {
  const { token, slug, qrCode } = await params
  const [participant, features] = await Promise.all([
    requireParticipantPage(token),
    getParticipantFeatureFlags(),
  ])
  if (!participant.groupId) notFound()
  if (isTeamChallengeSlug(slug) && !features.teamChallenge) notFound()

  if (!isTeamChallengeSlug(slug)) notFound()

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || challenge.type !== 'TEAM') notFound()

  const question = await prisma.ycQuizQuestion.findFirst({
    where: { challengeId: challenge.id, fragmentQrCode: qrCode },
  })
  if (!question) notFound()

  const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
  if (status && ['EMERGENCY', 'WAITING', 'QUIZ_OPEN', 'FAILED'].includes(status.status)) {
    notFound()
  }

  return (
    <FormShell title={challenge.title} sub="Konfirmasi Fragment" back={`/yc/p/${token}/challenge/${slug}`}>
      <ScanConfirmPanel
        token={token}
        slug={slug}
        qrCode={qrCode}
        fragmentOrder={question.fragmentOrder}
      />
    </FormShell>
  )
}
