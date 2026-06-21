/** Client-safe outbound schedule and display helpers (no Prisma). */

export const OUTBOUND_POSITION_COUNT = 5

export function isValidOutboundPosition(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= OUTBOUND_POSITION_COUNT
}

/** Jadwal final Outbound — 5 ronde × 5 pos. [round 1–5][pos 1–5] → [teamA, teamB] */
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

/** Lawan di ronde afterRound + 1 (tebakan diberikan setelah ronde selesai). */
export function getNextOpponentNum(teamNum: number, afterRound: number): number | null {
  const nextRound = afterRound + 1
  if (nextRound < 1 || nextRound > OUTBOUND_SCHEDULE.length) return null
  for (const [teamANum, teamBNum] of OUTBOUND_SCHEDULE[nextRound - 1]!) {
    if (teamANum === teamNum) return teamBNum
    if (teamBNum === teamNum) return teamANum
  }
  return null
}

export function isNextOpponentGuessCorrect(
  guessNum: number,
  teamNum: number,
  afterRound: number,
): boolean {
  const nextOpponent = getNextOpponentNum(teamNum, afterRound)
  return nextOpponent != null && guessNum === nextOpponent
}

export type OutboundGuessClue = {
  clue: string
  answer: number
}

/** Petunjuk tebakan lawan berikutnya — keyed by teamNum, then afterRound (1–4). */
export const OUTBOUND_GUESS_CLUES: Readonly<
  Record<number, Readonly<Record<number, OutboundGuessClue>>>
> = {
  1: {
    1: {
      clue: 'Setelah air bah, Nuh dan keluarganya yang masuk ke bahtera berjumlah berapa orang?',
      answer: 8,
    },
    2: {
      clue: 'Dalam berapa hari Tuhan menciptakan langit dan bumi?',
      answer: 6,
    },
    3: {
      clue: 'Ada berapa buah Roh Kudus yang disebutkan dalam Galatia 5?',
      answer: 9,
    },
    4: {
      clue: 'Bangsa Israel mengelilingi tembok Yerikho sebanyak berapa kali pada hari terakhir?',
      answer: 7,
    },
  },
  2: {
    1: {
      clue: 'Bangsa Israel mengelilingi Yerikho sebanyak berapa kali pada hari terakhir?',
      answer: 7,
    },
    2: {
      clue: 'Ada berapa tulah yang Tuhan kirim ke Mesir?',
      answer: 10,
    },
    3: {
      clue: 'Berapa orang yang diselamatkan dalam bahtera Nuh?',
      answer: 8,
    },
    4: {
      clue: 'Tuhan menciptakan dunia dalam berapa hari?',
      answer: 6,
    },
  },
  3: {
    1: {
      clue: 'Tuhan menciptakan dunia dalam berapa hari?',
      answer: 6,
    },
    2: {
      clue: 'Ada berapa buah Roh Kudus?',
      answer: 9,
    },
    3: {
      clue: 'Yerikho dikelilingi berapa kali pada hari terakhir?',
      answer: 7,
    },
    4: {
      clue: 'Ada berapa tulah Mesir?',
      answer: 10,
    },
  },
  4: {
    1: {
      clue: 'Tuhan menurunkan berapa tulah kepada Mesir?',
      answer: 10,
    },
    2: {
      clue: 'Berapa orang yang masuk bahtera Nuh?',
      answer: 8,
    },
    3: {
      clue: 'Dalam berapa hari Tuhan menciptakan dunia?',
      answer: 6,
    },
    4: {
      clue: 'Ada berapa buah Roh Kudus?',
      answer: 9,
    },
  },
  5: {
    1: {
      clue: 'Ada berapa buah Roh Kudus?',
      answer: 9,
    },
    2: {
      clue: 'Yerikho dikelilingi berapa kali pada hari terakhir?',
      answer: 7,
    },
    3: {
      clue: 'Ada berapa tulah Mesir?',
      answer: 10,
    },
    4: {
      clue: 'Berapa orang yang masuk ke bahtera Nuh?',
      answer: 8,
    },
  },
  6: {
    1: {
      clue: 'Berapa kali Petrus menyangkal Yesus?',
      answer: 3,
    },
    2: {
      clue: 'Berapa gembala yang dicari setelah yang hilang ditemukan? (99 + 1 yang hilang)',
      answer: 1,
    },
    3: {
      clue: 'Ada berapa sungai yang mengalir dari Eden menurut Kejadian?',
      answer: 4,
    },
    4: {
      clue: 'Yesus memiliki berapa natur? (manusia dan Allah)',
      answer: 2,
    },
  },
  7: {
    1: {
      clue: 'Berapa murid yang pertama kali dipanggil bersaudara? (Petrus dan Andreas)',
      answer: 2,
    },
    2: {
      clue: 'Berapa roti yang dipakai Yesus memberi makan lima ribu orang?',
      answer: 5,
    },
    3: {
      clue: 'Berapa kali Petrus menyangkal Yesus?',
      answer: 3,
    },
    4: {
      clue: 'Berapa Allah yang kita sembah?',
      answer: 1,
    },
  },
  8: {
    1: {
      clue: 'Ada berapa Allah yang benar?',
      answer: 1,
    },
    2: {
      clue: 'Ada berapa sungai di taman Eden?',
      answer: 4,
    },
    3: {
      clue: 'Yesus mengutus murid-murid berdua-dua. Angka berapa itu?',
      answer: 2,
    },
    4: {
      clue: 'Berapa roti yang dipakai memberi makan lima ribu orang?',
      answer: 5,
    },
  },
  9: {
    1: {
      clue: 'Berapa roti yang dipakai Yesus memberi makan lima ribu orang?',
      answer: 5,
    },
    2: {
      clue: 'Berapa kali Petrus menyangkal Yesus?',
      answer: 3,
    },
    3: {
      clue: 'Berapa Allah yang benar?',
      answer: 1,
    },
    4: {
      clue: 'Ada berapa sungai di Eden?',
      answer: 4,
    },
  },
  10: {
    1: {
      clue: 'Ada berapa sungai yang keluar dari Eden?',
      answer: 4,
    },
    2: {
      clue: 'Yesus mengutus murid-murid berdua-dua. Angka berapa itu?',
      answer: 2,
    },
    3: {
      clue: 'Berapa roti untuk memberi makan lima ribu orang?',
      answer: 5,
    },
    4: {
      clue: 'Berapa kali Petrus menyangkal Yesus?',
      answer: 3,
    },
  },
}

export function outboundGuessClueForTeam(
  teamNum: number,
  afterRound: number,
): OutboundGuessClue | null {
  return OUTBOUND_GUESS_CLUES[teamNum]?.[afterRound] ?? null
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

export function outboundFullScheduleTable() {
  return OUTBOUND_SCHEDULE.map((roundMatches, roundIndex) => ({
    round: roundIndex + 1,
    positions: roundMatches.map(([teamANum, teamBNum], positionIndex) => ({
      position: positionIndex + 1,
      teamANum,
      teamBNum,
      label: `${teamANum} vs ${teamBNum}`,
    })),
  }))
}
