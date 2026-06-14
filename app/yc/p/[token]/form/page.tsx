import FormWorshipClient from '@/components/yc/participant/FormWorshipClient'
import { requireParticipantPage } from '@/lib/yc/page-guard'

type Props = { params: Promise<{ token: string }> }

export default async function FormWorshipPage({ params }: Props) {
  const { token } = await params
  const participant = await requireParticipantPage(token)

  return (
    <FormWorshipClient token={token} alreadySubmitted={participant.isSubmitForm} />
  )
}
