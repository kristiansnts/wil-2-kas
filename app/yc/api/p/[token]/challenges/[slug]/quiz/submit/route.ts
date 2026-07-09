import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardTeamChallengeAccess } from '@/lib/yc/features'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { submitQuizAnswer } from '@/lib/yc/emergency'
import { ycLog } from '@/lib/yc/log'

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
  if (!challenge) return jsonError('Challenge tidak ditemukan', 404)

  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { groupId_challengeId: { groupId: participant.groupId, challengeId: challenge.id } },
  })
  if (!session) return jsonError('Session tidak ditemukan')

  const body = await req.json()
  const questionId = String(body.questionId ?? '')
  const selectedAnswer = String(body.selectedAnswer ?? '')
  if (!questionId || !selectedAnswer) return jsonError('Jawaban wajib diisi')

  try {
    const quizResult = await submitQuizAnswer(session.id, questionId, selectedAnswer, participant.id)
    ycLog('emergency-quiz', quizResult.correct ? 'correct' : 'wrong', {
      participantId: participant.id,
      groupId: participant.groupId,
      questionId,
      selectedAnswer,
      ...(quizResult.correct
        ? { fragmentOrder: quizResult.fragmentOrder, points: quizResult.points }
        : { retryAvailableAt: quizResult.retryAvailableAt }),
    })
    return NextResponse.json(quizResult)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal submit quiz'
    ycLog('emergency-quiz', 'error', {
      participantId: participant.id,
      groupId: participant.groupId,
      questionId,
      message,
    })
    return jsonError(message)
  }
}
