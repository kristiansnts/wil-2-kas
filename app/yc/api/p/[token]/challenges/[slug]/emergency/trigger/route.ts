import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardTeamChallengeAccess } from '@/lib/yc/features'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { triggerEmergency, buildEmergencyStatus } from '@/lib/yc/emergency'
import { ycLog } from '@/lib/yc/log'
import { parseScannedQrCode } from '@/lib/yc/parse-qr-scan'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, slug } = await params
  const blocked = await guardTeamChallengeAccess(slug)
  if (blocked) return blocked
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || challenge.type !== 'TEAM') return jsonError('Challenge team tidak ditemukan', 404)

  const body = await req.json().catch(() => ({}))
  const qrCode = parseScannedQrCode(String(body.qrCode ?? ''))
  if (!qrCode) {
    ycLog('emergency-trigger', 'invalid_qr', { participantId: participant.id, slug })
    return jsonError('QR Fragment wajib diisi')
  }

  const question = await prisma.ycQuizQuestion.findFirst({
    where: { challengeId: challenge.id, fragmentQrCode: qrCode },
  })
  if (!question) {
    ycLog('emergency-trigger', 'unknown_fragment', { participantId: participant.id, qrCode })
    return jsonError('QR Fragment tidak dikenali')
  }

  try {
    const session = await triggerEmergency(participant.groupId, challenge.id, participant.id, question.id)
    const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
    ycLog('emergency-trigger', 'ok', {
      participantId: participant.id,
      groupId: participant.groupId,
      fragmentOrder: question.fragmentOrder,
      qrCode,
      emergencyCalledAt: session.emergencyCalledAt?.toISOString() ?? null,
    })
    return NextResponse.json({
      ok: true,
      status: 'EMERGENCY',
      fragmentOrder: question.fragmentOrder,
      emergencyCalledAt: session.emergencyCalledAt?.toISOString() ?? null,
      emergencyStatus: status,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal trigger emergency'
    ycLog('emergency-trigger', 'error', {
      participantId: participant.id,
      groupId: participant.groupId,
      fragmentOrder: question.fragmentOrder,
      qrCode,
      message,
    })
    return jsonError(message)
  }
}
