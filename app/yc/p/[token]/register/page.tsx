import { notFound } from 'next/navigation'
import RegisterClient from '@/components/yc/participant/RegisterClient'
import { redirectComiteeToAdmin } from '@/lib/yc/committee'
import { getParticipantByToken } from '@/lib/yc/participant'
import { listChurchOptions } from '@/lib/yc/churches'
import type { ServiceInterest, YcGender } from '@/lib/yc/constants'

type Props = { params: Promise<{ token: string }> }

export default async function RegisterPage({ params }: Props) {
  const { token } = await params
  const participant = await getParticipantByToken(token)
  if (!participant) notFound()

  await redirectComiteeToAdmin(participant)

  const churches = await listChurchOptions()
  const interests = Array.isArray(participant.serviceInterest)
    ? (participant.serviceInterest as ServiceInterest[])
    : []

  return (
    <RegisterClient
      token={token}
      churches={churches}
      initial={{
        name: participant.name,
        gender: participant.gender as YcGender | null,
        churchName: participant.churchName,
        instagram: participant.instagram,
        tiktok: participant.tiktok,
        serviceInterest: interests,
      }}
    />
  )
}
