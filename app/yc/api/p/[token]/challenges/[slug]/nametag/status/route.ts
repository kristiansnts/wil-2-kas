import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { buildNametagStatus } from '@/lib/yc/extrovert'
import { YC_SIPALING_EXTROVERT_SLUG } from '@/lib/yc/constants'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token, slug } = await params
  if (slug !== YC_SIPALING_EXTROVERT_SLUG) return jsonError('Challenge tidak valid', 404)

  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const status = await buildNametagStatus(result.participant.id)
  return NextResponse.json(status)
}
