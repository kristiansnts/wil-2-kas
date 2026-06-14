import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')
  if (!participant.name) return jsonError('Lengkapi registrasi dulu')

  const group = await prisma.ycGroup.findUnique({ where: { id: participant.groupId } })
  if (!group) return jsonError('Kelompok tidak ditemukan')
  if (group.captainParticipantId) return jsonError('Captain sudah ada')

  await prisma.ycGroup.update({
    where: { id: group.id },
    data: { captainParticipantId: participant.id },
  })

  return NextResponse.json({ ok: true })
}
