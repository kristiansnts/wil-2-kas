import { NextResponse } from 'next/server'
import { withParticipant } from '@/lib/yc/api-helpers'
import { ycLog } from '@/lib/yc/log'

type Params = { params: Promise<{ token: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const body = await req.json().catch(() => ({}))
  const scope = String(body.scope ?? 'client')
  const event = String(body.event ?? 'unknown')
  const data =
    body.data && typeof body.data === 'object' && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : undefined

  ycLog(scope, event, {
    participantId: result.participant.id,
    groupId: result.participant.groupId,
    ...data,
  })

  return NextResponse.json({ ok: true })
}
