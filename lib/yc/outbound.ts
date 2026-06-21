import { prisma } from '@/lib/prisma'
import { YC_GROUP_COUNT, YC_OUTBOUND_GUESS_POINTS } from '@/lib/yc/constants'
import { isGuessCorrect, teamSlugFromNum } from '@/lib/yc/outbound-data'
import { addGroupPoints } from '@/lib/yc/points'

export {
  OUTBOUND_SCHEDULE,
  buildOutboundMatchSeed,
  groupNameFromNum,
  isGuessCorrect,
  outboundMatchLabel,
  outboundMatchStatus,
  teamSlugFromNum,
  type OutboundMatchStatus,
} from '@/lib/yc/outbound-data'

type OutboundMatchRow = {
  id: string
  challengeId: string
  round: number
  position: number
  teamANum: number
  teamBNum: number
  teamAGuessNum: number | null
  teamBGuessNum: number | null
  teamAGuessPointsAwarded: boolean
  teamBGuessPointsAwarded: boolean
  winnerGroupId: string | null
}

export async function resolveGroupIdByNum(num: number): Promise<string | null> {
  if (num < 1 || num > YC_GROUP_COUNT) return null
  const group = await prisma.ycGroup.findUnique({
    where: { slug: teamSlugFromNum(num) },
    select: { id: true },
  })
  return group?.id ?? null
}

export async function scoreOutboundGuesses(match: OutboundMatchRow): Promise<{
  teamACorrect: boolean | null
  teamBCorrect: boolean | null
  teamAPointsAwarded: number
  teamBPointsAwarded: number
}> {
  let teamAPointsAwarded = 0
  let teamBPointsAwarded = 0
  let teamACorrect: boolean | null = null
  let teamBCorrect: boolean | null = null

  const updates: {
    teamAGuessPointsAwarded?: boolean
    teamBGuessPointsAwarded?: boolean
  } = {}

  if (match.teamAGuessNum != null) {
    teamACorrect = isGuessCorrect(match.teamAGuessNum, match.teamBNum)
    if (teamACorrect && !match.teamAGuessPointsAwarded) {
      const groupId = await resolveGroupIdByNum(match.teamANum)
      if (groupId) {
        await addGroupPoints(groupId, YC_OUTBOUND_GUESS_POINTS)
        teamAPointsAwarded = YC_OUTBOUND_GUESS_POINTS
        updates.teamAGuessPointsAwarded = true
      }
    }
  }

  if (match.teamBGuessNum != null) {
    teamBCorrect = isGuessCorrect(match.teamBGuessNum, match.teamANum)
    if (teamBCorrect && !match.teamBGuessPointsAwarded) {
      const groupId = await resolveGroupIdByNum(match.teamBNum)
      if (groupId) {
        await addGroupPoints(groupId, YC_OUTBOUND_GUESS_POINTS)
        teamBPointsAwarded = YC_OUTBOUND_GUESS_POINTS
        updates.teamBGuessPointsAwarded = true
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await prisma.ycOutboundMatch.update({
      where: { id: match.id },
      data: updates,
    })
  }

  return { teamACorrect, teamBCorrect, teamAPointsAwarded, teamBPointsAwarded }
}
