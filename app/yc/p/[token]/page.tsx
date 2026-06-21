import { notFound } from 'next/navigation'
import DashboardClient from '@/components/yc/participant/DashboardClient'
import { redirectComiteeToAdmin } from '@/lib/yc/committee'
import { getParticipantFeatureFlags } from '@/lib/yc/features'
import { getParticipantByToken, toParticipantPublic } from '@/lib/yc/participant'
type Props = { params: Promise<{ token: string }> }

export default async function ParticipantDashboardPage({ params }: Props) {
  const { token } = await params
  const [flags, participant] = await Promise.all([
    getParticipantFeatureFlags(),
    getParticipantByToken(token),
  ])
  if (!participant) notFound()

  await redirectComiteeToAdmin(participant, token)

  if (!participant.name || !participant.gender) {
    const { redirect } = await import('next/navigation')
    redirect(`/yc/p/${token}/register`)
  }

  return <DashboardClient participant={toParticipantPublic(participant)} features={flags} />
}
