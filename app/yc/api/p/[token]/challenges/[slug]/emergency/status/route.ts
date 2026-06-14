import { NextResponse } from 'next/server'
import { guardTeamChallengeAccess } from '@/lib/yc/features'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { buildEmergencyStatus } from '@/lib/yc/emergency'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token, slug } = await params
  const blocked = await guardTeamChallengeAccess(slug)
  if (blocked) return blocked
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
  return NextResponse.json(status)
}
