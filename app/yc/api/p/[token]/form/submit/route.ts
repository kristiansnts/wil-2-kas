import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token } = await params
  const auth = await withParticipant(token)
  if ('error' in auth) return auth.error

  const { participant } = auth
  if (participant.isSubmitForm) return jsonError('Kamu sudah mengirim jawaban', 409)

  const body = await req.json()
  const answer = String(body.answer ?? '').trim()
  if (!answer) return jsonError('Jawaban wajib diisi')

  await prisma.$transaction(async tx => {
    await tx.ycFormSubmission.create({ data: { answer } })
    await tx.ycParticipant.update({
      where: { id: participant.id },
      data: { isSubmitForm: true },
    })
  })

  return NextResponse.json({ ok: true })
}
