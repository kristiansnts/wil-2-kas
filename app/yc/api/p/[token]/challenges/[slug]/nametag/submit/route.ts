import { NextResponse } from 'next/server'
import { guardNametagPairingAccess } from '@/lib/yc/features'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { submitNametagStory } from '@/lib/yc/extrovert'
import { YC_SIPALING_EXTROVERT_SLUG } from '@/lib/yc/constants'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, slug } = await params
  if (slug !== YC_SIPALING_EXTROVERT_SLUG) return jsonError('Challenge tidak valid', 404)
  const blocked = await guardNametagPairingAccess()
  if (blocked) return blocked

  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const body = await req.json().catch(() => ({}))
  const storyText = String(body.storyText ?? '')

  const submit = await submitNametagStory(result.participant.id, storyText)
  if ('error' in submit) return jsonError(submit.error)

  return NextResponse.json(submit)
}
