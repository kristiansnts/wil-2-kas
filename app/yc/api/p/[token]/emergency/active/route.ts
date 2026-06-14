import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { getActiveEmergency } from '@/lib/yc/emergency'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  const active = await getActiveEmergency(participant.groupId)
  return NextResponse.json(active)
}
