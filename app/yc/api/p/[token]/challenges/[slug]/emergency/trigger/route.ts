import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { triggerEmergency, buildEmergencyStatus } from '@/lib/yc/emergency'
import { parseScannedQrCode } from '@/lib/yc/parse-qr-scan'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, slug } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || challenge.type !== 'TEAM') return jsonError('Challenge team tidak ditemukan', 404)

  const body = await req.json().catch(() => ({}))
  const qrCode = parseScannedQrCode(String(body.qrCode ?? ''))
  if (!qrCode) return jsonError('QR Fragment wajib diisi')

  const question = await prisma.ycQuizQuestion.findFirst({
    where: { challengeId: challenge.id, fragmentQrCode: qrCode },
  })
  if (!question) return jsonError('QR Fragment tidak dikenali')

  try {
    const session = await triggerEmergency(participant.groupId, challenge.id, participant.id, question.id)
    const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
    return NextResponse.json({
      ok: true,
      status: 'EMERGENCY',
      fragmentOrder: question.fragmentOrder,
      emergencyCalledAt: session.emergencyCalledAt?.toISOString() ?? null,
      emergencyStatus: status,
    })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Gagal trigger emergency')
  }
}
