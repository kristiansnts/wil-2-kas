import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { scanNametagPairing } from '@/lib/yc/extrovert'
import { parseParticipantTokenFromQr } from '@/lib/yc/parse-participant-qr'
import { YC_SIPALING_EXTROVERT_SLUG } from '@/lib/yc/constants'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, slug } = await params
  if (slug !== YC_SIPALING_EXTROVERT_SLUG) return jsonError('Challenge tidak valid', 404)

  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const body = await req.json().catch(() => ({}))
  const raw = String(body.qrCode ?? body.text ?? '')
  const scannedToken = parseParticipantTokenFromQr(raw)
  if (!scannedToken) return jsonError('QR name tag tidak valid')

  const scan = await scanNametagPairing(result.participant.id, scannedToken)
  if ('error' in scan) return jsonError(scan.error)

  return NextResponse.json({ ok: true, pairing: scan.pairing })
}
