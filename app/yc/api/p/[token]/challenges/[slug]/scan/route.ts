import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardTeamChallengeAccess } from '@/lib/yc/features'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { buildEmergencyStatus } from '@/lib/yc/emergency'
import { ycLog } from '@/lib/yc/log'
import { parseScannedQrCode } from '@/lib/yc/parse-qr-scan'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, slug } = await params
  ycLog('treasure-scan', 'request', { slug })

  const blocked = await guardTeamChallengeAccess(slug)
  if (blocked) {
    ycLog('treasure-scan', 'blocked_feature', { slug })
    return blocked
  }

  const result = await withParticipant(token)
  if ('error' in result) {
    ycLog('treasure-scan', 'auth_failed', { slug })
    return result.error
  }

  const { participant } = result
  if (!participant.groupId) {
    ycLog('treasure-scan', 'no_group', { participantId: participant.id })
    return jsonError('Belum ada kelompok')
  }

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || challenge.type !== 'TEAM') {
    ycLog('treasure-scan', 'challenge_not_found', { slug })
    return jsonError('Challenge team tidak ditemukan', 404)
  }

  const body = await req.json().catch(() => ({}))
  const raw = String(body.qrCode ?? body.text ?? '')
  const qrCode = parseScannedQrCode(raw)
  if (!qrCode) {
    ycLog('treasure-scan', 'invalid_qr', {
      participantId: participant.id,
      rawLen: raw.length,
      rawPreview: raw.slice(0, 80),
    })
    return jsonError('QR tidak valid')
  }

  const question = await prisma.ycQuizQuestion.findFirst({
    where: { challengeId: challenge.id, fragmentQrCode: qrCode },
  })
  if (!question) {
    ycLog('treasure-scan', 'unknown_fragment', {
      participantId: participant.id,
      groupId: participant.groupId,
      qrCode,
    })
    return jsonError('QR Fragment tidak dikenali')
  }

  const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
  if (status && ['EMERGENCY', 'WAITING', 'QUIZ_OPEN', 'FAILED'].includes(status.status)) {
    ycLog('treasure-scan', 'emergency_in_progress', {
      participantId: participant.id,
      groupId: participant.groupId,
      teamStatus: status.status,
      fragmentOrder: question.fragmentOrder,
    })
    return jsonError('Emergency meeting masih berlangsung')
  }

  ycLog('treasure-scan', 'ok', {
    participantId: participant.id,
    groupId: participant.groupId,
    qrCode,
    fragmentOrder: question.fragmentOrder,
  })

  return NextResponse.json({
    ok: true,
    qrCode,
    fragmentOrder: question.fragmentOrder,
  })
}
