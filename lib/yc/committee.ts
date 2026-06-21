import { redirect } from 'next/navigation'

type CommitteeParticipant = { isComitee: boolean }

export function committeeLoginPath(token: string): string {
  return `/yc/api/p/${token}/committee`
}

export function redirectComiteeToAdmin(participant: CommitteeParticipant, token: string): void {
  if (!participant.isComitee) return
  redirect(committeeLoginPath(token))
}
