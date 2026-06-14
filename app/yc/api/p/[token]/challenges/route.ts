import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withParticipant } from '@/lib/yc/api-helpers'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const { participant } = result
  const challenges = await prisma.ycChallenge.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { title: 'asc' }],
  })

  const submissions = await prisma.ycChallengeSubmission.findMany({
    where: {
      OR: [
        { participantId: participant.id },
        ...(participant.groupId ? [{ groupId: participant.groupId }] : []),
      ],
    },
  })

  const teamSessions = participant.groupId
    ? await prisma.ycTeamChallengeSession.findMany({
        where: { groupId: participant.groupId },
      })
    : []

  const items = challenges.map(c => {
    const sub = submissions.find(s => s.challengeId === c.id)
    const session = teamSessions.find(s => s.challengeId === c.id)
    const completed =
      c.type === 'INDIVIDUAL'
        ? sub?.status === 'APPROVED'
        : session?.status === 'COMPLETED'

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      type: c.type,
      description: c.description,
      points: c.points,
      isActive: c.isActive,
      completed,
      submissionStatus: sub?.status ?? null,
      teamStatus: session?.status ?? null,
    }
  })

  return NextResponse.json({ challenges: items })
}
