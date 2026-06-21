import { redirect } from 'next/navigation'
import { redirectComiteeToAdmin } from './committee'
import { getParticipantByToken } from './participant'

export async function requireParticipantPage(token: string, options?: { allowUnregistered?: boolean }) {
  const participant = await getParticipantByToken(token)
  if (!participant) redirect('/yc')

  redirectComiteeToAdmin(participant, token)

  if (!options?.allowUnregistered && (!participant.name || !participant.gender)) {
    redirect(`/yc/p/${token}/register`)
  }

  return participant
}
