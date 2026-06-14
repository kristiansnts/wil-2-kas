import { NextResponse } from 'next/server'
import { requireParticipant } from './participant'

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function withParticipant(token: string) {
  const participant = await requireParticipant(token)
  if (!participant) return { error: jsonError('Peserta tidak ditemukan', 404) }
  return { participant }
}
