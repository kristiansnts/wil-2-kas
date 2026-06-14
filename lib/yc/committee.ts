import { redirect } from 'next/navigation'
import { setYcSession } from './session'

type CommitteeParticipant = { isComitee: boolean }

export async function redirectComiteeToAdmin(participant: CommitteeParticipant): Promise<void> {
  if (!participant.isComitee) return
  await setYcSession({ role: 'admin' })
  redirect('/yc/admin')
}
