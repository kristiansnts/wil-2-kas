import { NextResponse } from 'next/server'
import { getParticipantByToken, toParticipantPublic } from '@/lib/yc/participant'
import { jsonError } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const participant = await getParticipantByToken(token)
  if (!participant) return jsonError('Peserta tidak ditemukan', 404)
  return NextResponse.json(toParticipantPublic(participant))
}
