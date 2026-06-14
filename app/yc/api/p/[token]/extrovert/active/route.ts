import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { getActiveNametagInvite } from '@/lib/yc/extrovert'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const active = await getActiveNametagInvite(result.participant.id)
  return NextResponse.json(active)
}
