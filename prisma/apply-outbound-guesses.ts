/**
 * Apply outbound guess answers from clue keys and award +10 pts per correct guess.
 * Usage: npx tsx prisma/apply-outbound-guesses.ts [--team=N] [--dry-run]
 */
import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDirectDatabaseUrl } from '../lib/database-url'
import { YC_OUTBOUND_SLUG } from '../lib/yc/constants'
import { OUTBOUND_GUESS_CLUES } from '../lib/yc/outbound-data'
import { scoreOutboundGuesses } from '../lib/yc/outbound'

const adapter = new PrismaPg({ connectionString: getDirectDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const teamFilter = args.find(a => a.startsWith('--team='))
const onlyTeam = teamFilter ? Number(teamFilter.split('=')[1]) : null

function guessForTeam(teamNum: number, afterRound: number): number | null {
  if (onlyTeam != null && teamNum !== onlyTeam) return null
  return OUTBOUND_GUESS_CLUES[teamNum]?.[afterRound]?.answer ?? null
}

async function main() {
  const challenge = await prisma.ycChallenge.findUnique({
    where: { slug: YC_OUTBOUND_SLUG },
    select: { id: true },
  })
  if (!challenge) {
    throw new Error('Outbound challenge not found — run db:seed-yc first')
  }

  const matches = await prisma.ycOutboundMatch.findMany({
    where: { challengeId: challenge.id, round: { lte: 4 } },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
  })

  let updated = 0
  let scored = 0

  for (const match of matches) {
    const teamAGuess = guessForTeam(match.teamANum, match.round)
    const teamBGuess = guessForTeam(match.teamBNum, match.round)

    const data: { teamAGuessNum?: number; teamBGuessNum?: number } = {}
    if (teamAGuess != null && match.teamAGuessNum !== teamAGuess) {
      data.teamAGuessNum = teamAGuess
    }
    if (teamBGuess != null && match.teamBGuessNum !== teamBGuess) {
      data.teamBGuessNum = teamBGuess
    }

    if (Object.keys(data).length === 0) continue

    console.log(
      `R${match.round} Pos${match.position} (${match.teamANum} vs ${match.teamBNum}):`,
      data,
    )

    if (dryRun) {
      updated++
      continue
    }

    const saved = await prisma.ycOutboundMatch.update({
      where: { id: match.id },
      data,
    })
    updated++

    const result = await scoreOutboundGuesses(saved)
    if (result.teamAPointsAwarded || result.teamBPointsAwarded) {
      scored += result.teamAPointsAwarded + result.teamBPointsAwarded
      console.log(
        `  +${result.teamAPointsAwarded} pts Tim ${match.teamANum}, +${result.teamBPointsAwarded} pts Tim ${match.teamBNum}`,
      )
    }
  }

  if (onlyTeam != null) {
    const group = await prisma.ycGroup.findUnique({
      where: { slug: `team-${onlyTeam}` },
      select: { name: true, points: true },
    })
    console.log(`\n${group?.name ?? `Tim ${onlyTeam}`} total poin: ${group?.points ?? '?'}`)
  }

  console.log(`\nDone. ${updated} match(es) updated${dryRun ? ' (dry run)' : ''}, ${scored} pts awarded.`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
