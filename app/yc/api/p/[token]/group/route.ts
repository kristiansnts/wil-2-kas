import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.group) return jsonError('Belum ada kelompok', 404)

  const g = participant.group
  return NextResponse.json({
    id: g.id,
    name: g.name,
    slug: g.slug,
    points: g.points,
    captain: g.captain ? { id: g.captain.id, name: g.captain.name } : null,
    contentCreator: g.contentCreator
      ? { id: g.contentCreator.id, name: g.contentCreator.name }
      : null,
    members: g.participants.map(m => ({
      id: m.id,
      name: m.name,
      token: m.token,
    })),
  })
}
