import { NextResponse } from 'next/server'
import { guardTeamChallengeAccess } from '@/lib/yc/features'
import { YC_TEAM_CHALLENGE_SLUG } from '@/lib/yc/constants'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { getActiveEmergency } from '@/lib/yc/emergency'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const blocked = await guardTeamChallengeAccess(YC_TEAM_CHALLENGE_SLUG)
  if (blocked) return NextResponse.json({ active: false })
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  const active = await getActiveEmergency(participant.groupId)
  return NextResponse.json(active)
}
