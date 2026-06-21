/** Client-safe outbound schedule and display helpers (no Prisma). */

export const OUTBOUND_POSITION_COUNT = 5

export function isValidOutboundPosition(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= OUTBOUND_POSITION_COUNT
}

/** [round 1–5][pos 1–5] → [teamA, teamB] */
export const OUTBOUND_SCHEDULE: readonly (readonly [number, number])[][] = [
  [
    [1, 10],
    [2, 9],
    [3, 8],
    [4, 7],
    [5, 6],
  ],
  [
    [5, 9],
    [1, 8],
    [2, 7],
    [3, 6],
    [4, 10],
  ],
  [
    [4, 8],
    [5, 7],
    [1, 6],
    [2, 10],
    [3, 9],
  ],
  [
    [3, 7],
    [4, 6],
    [5, 10],
    [1, 9],
    [2, 8],
  ],
  [
    [2, 6],
    [3, 10],
    [4, 9],
    [5, 8],
    [1, 7],
  ],
]

export function teamSlugFromNum(num: number): string {
  return `team-${num}`
}

export function groupNameFromNum(num: number): string {
  return `Kelompok ${num}`
}

export function isGuessCorrect(guessNum: number, opponentNum: number): boolean {
  return guessNum === opponentNum
}

export type OutboundMatchStatus = 'pending' | 'guessed' | 'done'

export function outboundMatchStatus(match: {
  teamAGuessNum: number | null
  teamBGuessNum: number | null
  winnerGroupId: string | null
}): OutboundMatchStatus {
  if (match.winnerGroupId) return 'done'
  if (match.teamAGuessNum != null || match.teamBGuessNum != null) return 'guessed'
  return 'pending'
}

export function outboundMatchLabel(match: {
  round: number
  position: number
  teamANum: number
  teamBNum: number
}) {
  return `Ronde ${match.round} · Pos ${match.position} — ${groupNameFromNum(match.teamANum)} vs ${groupNameFromNum(match.teamBNum)}`
}

export function buildOutboundMatchSeed(challengeId: string) {
  const rows: {
    challengeId: string
    round: number
    position: number
    teamANum: number
    teamBNum: number
  }[] = []

  OUTBOUND_SCHEDULE.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach(([teamANum, teamBNum], positionIndex) => {
      rows.push({
        challengeId,
        round: roundIndex + 1,
        position: positionIndex + 1,
        teamANum,
        teamBNum,
      })
    })
  })

  return rows
}

export function outboundScheduleForPosition(position: number) {
  if (position < 1 || position > OUTBOUND_SCHEDULE[0]?.length) return []
  return OUTBOUND_SCHEDULE.map((roundMatches, roundIndex) => {
    const [teamANum, teamBNum] = roundMatches[position - 1]!
    return { round: roundIndex + 1, teamANum, teamBNum }
  })
}
