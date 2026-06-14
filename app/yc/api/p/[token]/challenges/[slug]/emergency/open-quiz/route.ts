import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { openQuiz, buildEmergencyStatus } from '@/lib/yc/emergency'

type Params = { params: Promise<{ token: string; slug: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { token, slug } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  if (!participant.groupId) return jsonError('Belum ada kelompok')

  const challenge = await prisma.ycChallenge.findUnique({ where: { slug } })
  if (!challenge) return jsonError('Challenge tidak ditemukan', 404)

  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { groupId_challengeId: { groupId: participant.groupId, challengeId: challenge.id } },
  })
  if (!session) return jsonError('Session belum dimulai')

  try {
    await openQuiz(session.id, participant.id)
    const status = await buildEmergencyStatus(participant.groupId, slug, participant.id)
    return NextResponse.json(status)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Gagal membuka quiz')
  }
}
