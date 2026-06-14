import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string }> }

const MIN_NAME = 2
const MAX_NAME = 60

export async function PATCH(req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Data tidak valid')
  }

  const name = typeof (body as { name?: unknown }).name === 'string'
    ? (body as { name: string }).name.trim()
    : ''

  if (name.length < MIN_NAME || name.length > MAX_NAME) {
    return jsonError(`Nama kelompok harus ${MIN_NAME}–${MAX_NAME} karakter`)
  }

  const group = await prisma.ycGroup.findUnique({ where: { id: participant.groupId } })
  if (!group) return jsonError('Kelompok tidak ditemukan')
  if (group.captainParticipantId !== participant.id) {
    return jsonError('Hanya captain yang bisa mengubah nama kelompok')
  }

  const updated = await prisma.ycGroup.update({
    where: { id: group.id },
    data: { name },
    select: { name: true },
  })

  return NextResponse.json({ ok: true, name: updated.name })
}
