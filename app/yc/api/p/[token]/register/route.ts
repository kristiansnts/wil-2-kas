import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantByToken, toParticipantPublic } from '@/lib/yc/participant'
import { jsonError } from '@/lib/yc/api-helpers'
import type { ServiceInterest, YcGender } from '@/lib/yc/constants'

type Params = { params: Promise<{ token: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { token } = await params
  const participant = await getParticipantByToken(token)
  if (!participant) return jsonError('Peserta tidak ditemukan', 404)

  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const gender = body.gender === 'MALE' || body.gender === 'FEMALE' ? (body.gender as YcGender) : null
  const churchName = String(body.churchName ?? body.church ?? '').trim()
  const instagram = body.instagram ? String(body.instagram).trim() : null
  const tiktok = body.tiktok ? String(body.tiktok).trim() : null
  const serviceInterest = Array.isArray(body.serviceInterest)
    ? (body.serviceInterest as ServiceInterest[])
    : []

  if (!name) return jsonError('Nama wajib diisi')
  if (!gender) return jsonError('Jenis kelamin wajib dipilih')
  if (!churchName) return jsonError('Asal gereja wajib dipilih')

  await prisma.ycParticipant.update({
    where: { id: participant.id },
    data: { name, gender, churchName, instagram, tiktok, serviceInterest },
  })

  const updated = await getParticipantByToken(token)
  if (!updated) return jsonError('Peserta tidak ditemukan', 404)
  return NextResponse.json(toParticipantPublic(updated))
}
