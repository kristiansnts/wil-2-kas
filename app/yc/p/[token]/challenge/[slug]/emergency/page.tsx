import { notFound, redirect } from 'next/navigation'
import EmergencyClient from '@/components/yc/participant/EmergencyClient'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { prisma } from '@/lib/prisma'
import { buildEmergencyStatus } from '@/lib/yc/emergency'

type Props = { params: Promise<{ token: string; slug: string }> }

export default async function EmergencyPage({ params }: Props) {
  const { token, slug } = await params
  const participant = await requireParticipantPage(token)
  if (!participant.groupId) notFound()

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || challenge.type !== 'TEAM') notFound()

  const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
  if (!status) notFound()

  if (status.status === 'EXPLORING' || status.status === 'COMPLETED') {
    redirect(`/yc/p/${token}/challenge/${slug}`)
  }

  return (
    <EmergencyClient
      token={token}
      slug={slug}
      challengeTitle={challenge.title}
      initial={status}
    />
  )
}
