import FormWorshipClient from '@/components/yc/participant/FormWorshipClient'
import { getParticipantFeatureFlags } from '@/lib/yc/features'
import { requireParticipantPage } from '@/lib/yc/page-guard'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ token: string }> }

export default async function FormWorshipPage({ params }: Props) {
  const { token } = await params
  const [participant, features] = await Promise.all([
    requireParticipantPage(token),
    getParticipantFeatureFlags(),
  ])
  if (!features.worshipForm) notFound()

  return (
    <FormWorshipClient token={token} alreadySubmitted={participant.isSubmitForm} />
  )
}
