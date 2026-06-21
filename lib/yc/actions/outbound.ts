'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { YC_GROUP_COUNT, YC_OUTBOUND_GUESS_POINTS, YC_OUTBOUND_SLUG } from '@/lib/yc/constants'
import {
  groupNameFromNum,
  outboundMatchLabel,
  outboundMatchStatus,
  scoreOutboundGuesses,
  teamSlugFromNum,
} from '@/lib/yc/outbound'
import { requireYcAdmin } from '@/lib/yc/session'
import {
  clearOutboundPositionCookie,
  getOutboundPosition,
  setOutboundPositionCookie,
} from '@/lib/yc/outbound-session'
import { isValidOutboundPosition } from '@/lib/yc/outbound-data'

function revalidateOutboundPaths() {
  revalidatePath('/yc/admin/outbound')
  revalidatePath('/yc/admin/leaderboard')
}

async function requireOutboundPositionAccess(matchPosition: number): Promise<number | null> {
  const position = await getOutboundPosition()
  if (!position || position !== matchPosition) return null
  return position
}

export async function setOutboundPosition(position: number) {
  await requireYcAdmin()
  if (!isValidOutboundPosition(position)) {
    return { error: 'Pos harus 1–5' }
  }
  await setOutboundPositionCookie(position)
  revalidatePath('/yc/admin/outbound')
  return { ok: true as const, position }
}

export async function clearOutboundPosition() {
  await requireYcAdmin()
  await clearOutboundPositionCookie()
  revalidatePath('/yc/admin/outbound')
  return { ok: true as const }
}

function validateTeamNum(num: number): string | null {
  if (!Number.isInteger(num) || num < 1 || num > YC_GROUP_COUNT) {
    return 'Nomor kelompok harus 1–10'
  }
  return null
}

export type OutboundMatchListItem = {
  id: string
  round: number
  position: number
  teamANum: number
  teamBNum: number
  teamAGuessNum: number | null
  teamBGuessNum: number | null
  teamAGuessPointsAwarded: boolean
  teamBGuessPointsAwarded: boolean
  winnerGroupId: string | null
  label: string
  status: ReturnType<typeof outboundMatchStatus>
  teamASlug: string
  teamBSlug: string
}

export type OutboundMatchDetail = OutboundMatchListItem & {
  teamAName: string
  teamBName: string
  teamAId: string
  teamBId: string
  winnerName: string | null
  teamACorrect: boolean | null
  teamBCorrect: boolean | null
}

async function getOutboundChallengeId(): Promise<string | null> {
  const challenge = await prisma.ycChallenge.findUnique({
    where: { slug: YC_OUTBOUND_SLUG },
    select: { id: true },
  })
  return challenge?.id ?? null
}

function serializeMatch(
  match: {
    id: string
    round: number
    position: number
    teamANum: number
    teamBNum: number
    teamAGuessNum: number | null
    teamBGuessNum: number | null
    teamAGuessPointsAwarded: boolean
    teamBGuessPointsAwarded: boolean
    winnerGroupId: string | null
  },
  groupsByNum: Map<number, { id: string; name: string; slug: string }>,
): OutboundMatchListItem {
  return {
    id: match.id,
    round: match.round,
    position: match.position,
    teamANum: match.teamANum,
    teamBNum: match.teamBNum,
    teamAGuessNum: match.teamAGuessNum,
    teamBGuessNum: match.teamBGuessNum,
    teamAGuessPointsAwarded: match.teamAGuessPointsAwarded,
    teamBGuessPointsAwarded: match.teamBGuessPointsAwarded,
    winnerGroupId: match.winnerGroupId,
    label: outboundMatchLabel(match),
    status: outboundMatchStatus(match),
    teamASlug: groupsByNum.get(match.teamANum)?.slug ?? teamSlugFromNum(match.teamANum),
    teamBSlug: groupsByNum.get(match.teamBNum)?.slug ?? teamSlugFromNum(match.teamBNum),
  }
}

async function loadGroupsByNum() {
  const groups = await prisma.ycGroup.findMany({
    where: { slug: { startsWith: 'team-' } },
    select: { id: true, name: true, slug: true },
  })
  const map = new Map<number, { id: string; name: string; slug: string }>()
  for (const group of groups) {
    const num = Number(group.slug.replace('team-', ''))
    if (Number.isInteger(num)) map.set(num, group)
  }
  return map
}

export async function getOutboundMatches(position?: number): Promise<OutboundMatchListItem[]> {
  await requireYcAdmin()
  const challengeId = await getOutboundChallengeId()
  if (!challengeId) return []

  const pos = position ?? (await getOutboundPosition())
  if (!pos) return []

  const [matches, groupsByNum] = await Promise.all([
    prisma.ycOutboundMatch.findMany({
      where: { challengeId, position: pos },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    }),
    loadGroupsByNum(),
  ])

  return matches.map(match => serializeMatch(match, groupsByNum))
}

export async function getOutboundMatch(matchId: string): Promise<OutboundMatchDetail | null> {
  await requireYcAdmin()
  const match = await prisma.ycOutboundMatch.findUnique({
    where: { id: matchId },
    include: { winnerGroup: { select: { name: true } } },
  })
  if (!match) return null
  if (!(await requireOutboundPositionAccess(match.position))) return null

  const groupsByNum = await loadGroupsByNum()
  const base = serializeMatch(match, groupsByNum)
  const teamA = groupsByNum.get(match.teamANum)
  const teamB = groupsByNum.get(match.teamBNum)

  return {
    ...base,
    teamAName: teamA?.name ?? groupNameFromNum(match.teamANum),
    teamBName: teamB?.name ?? groupNameFromNum(match.teamBNum),
    teamAId: teamA?.id ?? '',
    teamBId: teamB?.id ?? '',
    winnerName: match.winnerGroup?.name ?? null,
    teamACorrect:
      match.teamAGuessNum != null ? match.teamAGuessNum === match.teamBNum : null,
    teamBCorrect:
      match.teamBGuessNum != null ? match.teamBGuessNum === match.teamANum : null,
  }
}

export async function saveOutboundGuesses(
  matchId: string,
  teamAGuessNum: number | null,
  teamBGuessNum: number | null,
) {
  await requireYcAdmin()

  if (teamAGuessNum != null) {
    const err = validateTeamNum(teamAGuessNum)
    if (err) return { error: `Tim A: ${err}` }
  }
  if (teamBGuessNum != null) {
    const err = validateTeamNum(teamBGuessNum)
    if (err) return { error: `Tim B: ${err}` }
  }

  const match = await prisma.ycOutboundMatch.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'Pertandingan tidak ditemukan' }
  if (!(await requireOutboundPositionAccess(match.position))) {
    return { error: 'Akses ditolak untuk pos ini' }
  }

  const updated = await prisma.ycOutboundMatch.update({
    where: { id: matchId },
    data: {
      teamAGuessNum,
      teamBGuessNum,
    },
  })

  const scoring = await scoreOutboundGuesses(updated)

  revalidateOutboundPaths()
  revalidatePath(`/yc/admin/outbound/${matchId}`)

  return {
    ok: true,
    teamACorrect: scoring.teamACorrect,
    teamBCorrect: scoring.teamBCorrect,
    teamAPointsAwarded: scoring.teamAPointsAwarded,
    teamBPointsAwarded: scoring.teamBPointsAwarded,
    guessPoints: YC_OUTBOUND_GUESS_POINTS,
  }
}

export async function setOutboundWinner(matchId: string, winnerGroupId: string) {
  await requireYcAdmin()

  const match = await prisma.ycOutboundMatch.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'Pertandingan tidak ditemukan' }
  if (!(await requireOutboundPositionAccess(match.position))) {
    return { error: 'Akses ditolak untuk pos ini' }
  }

  const groupsByNum = await loadGroupsByNum()
  const teamA = groupsByNum.get(match.teamANum)
  const teamB = groupsByNum.get(match.teamBNum)
  if (winnerGroupId !== teamA?.id && winnerGroupId !== teamB?.id) {
    return { error: 'Pemenang harus salah satu tim di pertandingan ini' }
  }

  await prisma.ycOutboundMatch.update({
    where: { id: matchId },
    data: { winnerGroupId },
  })

  revalidateOutboundPaths()
  revalidatePath(`/yc/admin/outbound/${matchId}`)
  return { ok: true }
}
