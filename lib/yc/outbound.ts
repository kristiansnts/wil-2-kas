import { prisma } from '@/lib/prisma'
import { YC_GROUP_COUNT, YC_OUTBOUND_GUESS_POINTS, YC_OUTBOUND_WIN_POINTS } from '@/lib/yc/constants'
import { isNextOpponentGuessCorrect, teamSlugFromNum } from '@/lib/yc/outbound-data'
import { addGroupPoints, adjustGroupPoints } from '@/lib/yc/points'

export {
  OUTBOUND_GUESS_CLUES,
  OUTBOUND_SCHEDULE,
  buildOutboundMatchSeed,
  getNextOpponentNum,
  groupNameFromNum,
  isGuessCorrect,
  isNextOpponentGuessCorrect,
  outboundFullScheduleTable,
  outboundGuessClueForTeam,
  outboundMatchLabel,
  outboundMatchStatus,
  teamSlugFromNum,
  type OutboundGuessClue,
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
  winnerPointsAwarded: boolean
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
    teamACorrect = isNextOpponentGuessCorrect(match.teamAGuessNum, match.teamANum, match.round)
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
    teamBCorrect = isNextOpponentGuessCorrect(match.teamBGuessNum, match.teamBNum, match.round)
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

type OutboundMatchWinnerRow = {
  id: string
  winnerGroupId: string | null
  winnerPointsAwarded: boolean
}

/** Award win points when panitia sets match winner; reverses prior winner if changed. */
export async function applyOutboundWinnerPoints(
  match: OutboundMatchWinnerRow,
  newWinnerGroupId: string,
): Promise<{ pointsAwarded: number }> {
  const prevId = match.winnerGroupId
  const prevAwarded = match.winnerPointsAwarded

  if (prevId === newWinnerGroupId && prevAwarded) {
    return { pointsAwarded: 0 }
  }

  if (prevId && prevAwarded && prevId !== newWinnerGroupId) {
    await adjustGroupPoints(prevId, -YC_OUTBOUND_WIN_POINTS)
  }

  let pointsAwarded = 0
  if (!(prevId === newWinnerGroupId && prevAwarded)) {
    await addGroupPoints(newWinnerGroupId, YC_OUTBOUND_WIN_POINTS)
    pointsAwarded = YC_OUTBOUND_WIN_POINTS
  }

  await prisma.ycOutboundMatch.update({
    where: { id: match.id },
    data: {
      winnerGroupId: newWinnerGroupId,
      winnerPointsAwarded: true,
    },
  })

  return { pointsAwarded }
}
