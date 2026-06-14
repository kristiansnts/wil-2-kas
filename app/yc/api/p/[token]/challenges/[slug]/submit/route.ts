import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, slug } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.name) return jsonError('Lengkapi registrasi dulu')

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge || !challenge.isActive) return jsonError('Challenge tidak ditemukan', 404)
  if (challenge.type !== 'INDIVIDUAL') return jsonError('Challenge ini bukan individual')

  const body = await req.json()
  const answerText = body.answerText ? String(body.answerText).trim() : null
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : null

  if (!answerText && !mediaUrl) return jsonError('Jawaban atau media wajib diisi')

  const submission = await prisma.ycChallengeSubmission.create({
    data: {
      challengeId: challenge.id,
      participantId: participant.id,
      answerText,
      mediaUrl,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ ok: true, submissionId: submission.id })
}
