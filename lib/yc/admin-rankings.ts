import { prisma } from '@/lib/prisma'
import {
  YC_OUTBOUND_GUESS_POINTS,
  YC_OUTBOUND_WIN_POINTS,
  YC_SIPALING_EXTROVERT_SLUG,
  YC_TEAM_CHALLENGE_SLUG,
  YC_TUKANG_NGONTEN_SLUG,
} from './constants'
import { isNextOpponentGuessCorrect } from './outbound-data'
import type { YcAdminGroupRank, YcAdminParticipantRank, YcAdminRankings } from './types'

const TOP_N = 3

function rankByPoints<T extends { points: number }>(items: T[]): (T & { rank: number })[] {
  const sorted = [...items].sort((a, b) => b.points - a.points || 0)
  let rank = 0
  let prevPoints: number | null = null
  return sorted.map((item, i) => {
    if (prevPoints !== item.points) {
      rank = i + 1
      prevPoints = item.points
    }
    return { ...item, rank }
  })
}

function topN<T extends { rank: number }>(items: T[]): T[] {
  return items.filter(item => item.rank <= TOP_N)
}

async function getTukangNgontenRanks(): Promise<YcAdminParticipantRank[]> {
  const grouped = await prisma.ycChallengeSubmission.groupBy({
    by: ['participantId'],
    where: {
      status: 'APPROVED',
      participantId: { not: null },
      groupId: null,
      challenge: { slug: YC_TUKANG_NGONTEN_SLUG },
    },
    _sum: { pointsAwarded: true },
    _count: true,
  })

  const participantIds = grouped
    .map(g => g.participantId)
    .filter((id): id is string => id != null)

  if (participantIds.length === 0) return []

  const participants = await prisma.ycParticipant.findMany({
    where: { id: { in: participantIds } },
    select: {
      id: true,
      name: true,
      group: { select: { name: true } },
    },
  })
  const byId = new Map(participants.map(p => [p.id, p]))

  const rows = grouped.map(g => {
    const p = byId.get(g.participantId!)
    return {
      id: g.participantId!,
      name: p?.name ?? 'Peserta',
      groupName: p?.group?.name ?? null,
      points: g._sum.pointsAwarded ?? 0,
      count: g._count,
    }
  })

  return topN(rankByPoints(rows))
}

async function getExtrovertRanks(): Promise<YcAdminParticipantRank[]> {
  const grouped = await prisma.ycNametagStory.groupBy({
    by: ['authorParticipantId'],
    where: {
      pairing: {
        status: 'COMPLETED',
        challenge: { slug: YC_SIPALING_EXTROVERT_SLUG },
      },
    },
    _sum: { pointsAwarded: true },
    _count: true,
  })

  if (grouped.length === 0) return []

  const participants = await prisma.ycParticipant.findMany({
    where: { id: { in: grouped.map(g => g.authorParticipantId) } },
    select: {
      id: true,
      name: true,
      group: { select: { name: true } },
    },
  })
  const byId = new Map(participants.map(p => [p.id, p]))

  const rows = grouped.map(g => {
    const p = byId.get(g.authorParticipantId)
    return {
      id: g.authorParticipantId,
      name: p?.name ?? 'Peserta',
      groupName: p?.group?.name ?? null,
      points: g._sum.pointsAwarded ?? 0,
      count: g._count,
    }
  })

  return topN(rankByPoints(rows))
}

async function getOutboundRanks(): Promise<YcAdminGroupRank[]> {
  const [matches, groups] = await Promise.all([
    prisma.ycOutboundMatch.findMany({
      select: {
        round: true,
        teamANum: true,
        teamBNum: true,
        teamAGuessNum: true,
        teamBGuessNum: true,
        winnerGroupId: true,
        teamAYelYelPoints: true,
        teamBYelYelPoints: true,
      },
    }),
    prisma.ycGroup.findMany({ select: { id: true, slug: true, name: true } }),
  ])

  const groupByNum = new Map<number, (typeof groups)[0]>()
  for (const group of groups) {
    const num = Number(group.slug.replace('team-', ''))
    if (Number.isInteger(num)) groupByNum.set(num, group)
  }

  const pointsByGroup = new Map<string, number>()
  const winsByGroup = new Map<string, number>()
  const guessPointsByGroup = new Map<string, number>()
  const yelYelPointsByGroup = new Map<string, number>()

  for (const group of groups) {
    pointsByGroup.set(group.id, 0)
    winsByGroup.set(group.id, 0)
    guessPointsByGroup.set(group.id, 0)
    yelYelPointsByGroup.set(group.id, 0)
  }

  function addGuessPoints(teamNum: number, guessNum: number | null, round: number) {
    if (guessNum == null || !isNextOpponentGuessCorrect(guessNum, teamNum, round)) return
    const group = groupByNum.get(teamNum)
    if (!group) return
    pointsByGroup.set(group.id, (pointsByGroup.get(group.id) ?? 0) + YC_OUTBOUND_GUESS_POINTS)
    guessPointsByGroup.set(
      group.id,
      (guessPointsByGroup.get(group.id) ?? 0) + YC_OUTBOUND_GUESS_POINTS,
    )
  }

  function addYelYelPoints(teamNum: number, pts: number) {
    if (pts <= 0) return
    const group = groupByNum.get(teamNum)
    if (!group) return
    pointsByGroup.set(group.id, (pointsByGroup.get(group.id) ?? 0) + pts)
    yelYelPointsByGroup.set(group.id, (yelYelPointsByGroup.get(group.id) ?? 0) + pts)
  }

  for (const match of matches) {
    addGuessPoints(match.teamANum, match.teamAGuessNum, match.round)
    addGuessPoints(match.teamBNum, match.teamBGuessNum, match.round)
    addYelYelPoints(match.teamANum, match.teamAYelYelPoints)
    addYelYelPoints(match.teamBNum, match.teamBYelYelPoints)

    if (match.winnerGroupId) {
      pointsByGroup.set(
        match.winnerGroupId,
        (pointsByGroup.get(match.winnerGroupId) ?? 0) + YC_OUTBOUND_WIN_POINTS,
      )
      winsByGroup.set(match.winnerGroupId, (winsByGroup.get(match.winnerGroupId) ?? 0) + 1)
    }
  }

  const rows = groups.map(g => {
    const wins = winsByGroup.get(g.id) ?? 0
    const guessPts = guessPointsByGroup.get(g.id) ?? 0
    const yelYelPts = yelYelPointsByGroup.get(g.id) ?? 0
    return {
      id: g.id,
      slug: g.slug,
      name: g.name,
      points: pointsByGroup.get(g.id) ?? 0,
      detail: `${wins} menang · ${guessPts} tebakan · ${yelYelPts} yel-yel`,
    }
  })

  return topN(rankByPoints(rows.filter(r => r.points > 0)))
}

async function getTeamActivityRanks(): Promise<YcAdminGroupRank[]> {
  const [treasureChallenge, questionCount, groupUploads, correctAttempts] = await Promise.all([
    prisma.ycChallenge.findUnique({
      where: { slug: YC_TEAM_CHALLENGE_SLUG },
      select: { id: true, points: true },
    }),
    prisma.ycQuizQuestion.count({
      where: { challenge: { slug: YC_TEAM_CHALLENGE_SLUG } },
    }),
    prisma.ycChallengeSubmission.groupBy({
      by: ['groupId'],
      where: {
        status: 'APPROVED',
        groupId: { not: null },
        challenge: { slug: YC_TUKANG_NGONTEN_SLUG },
      },
      _sum: { pointsAwarded: true },
      _count: true,
    }),
    prisma.ycQuizAttempt.findMany({
      where: {
        isCorrect: true,
        session: { challenge: { slug: YC_TEAM_CHALLENGE_SLUG } },
      },
      select: {
        questionId: true,
        session: { select: { groupId: true } },
      },
    }),
  ])

  const pointsPerFragment =
    treasureChallenge && questionCount > 0
      ? Math.max(1, Math.round(treasureChallenge.points / questionCount))
      : 0

  const fragmentsByGroup = new Map<string, Set<string>>()
  for (const attempt of correctAttempts) {
    const groupId = attempt.session.groupId
    if (!fragmentsByGroup.has(groupId)) fragmentsByGroup.set(groupId, new Set())
    fragmentsByGroup.get(groupId)!.add(attempt.questionId)
  }

  const uploadByGroup = new Map(
    groupUploads
      .filter(g => g.groupId != null)
      .map(g => [g.groupId!, { points: g._sum.pointsAwarded ?? 0, count: g._count }]),
  )

  const groups = await prisma.ycGroup.findMany({
    select: { id: true, slug: true, name: true },
  })

  const rows = groups.map(g => {
    const upload = uploadByGroup.get(g.id)
    const uploadPts = upload?.points ?? 0
    const fragmentCount = fragmentsByGroup.get(g.id)?.size ?? 0
    const treasurePts = fragmentCount * pointsPerFragment
    return {
      id: g.id,
      slug: g.slug,
      name: g.name,
      points: uploadPts + treasurePts,
      detail: `${fragmentCount} fragment · ${upload?.count ?? 0} upload kelompok`,
    }
  })

  return topN(rankByPoints(rows.filter(r => r.points > 0)))
}

export async function getAdminRankings(): Promise<YcAdminRankings> {
  const [tukangNgonten, extrovert, outbound, teamActivity] = await Promise.all([
    getTukangNgontenRanks(),
    getExtrovertRanks(),
    getOutboundRanks(),
    getTeamActivityRanks(),
  ])

  return { tukangNgonten, extrovert, outbound, teamActivity }
}
