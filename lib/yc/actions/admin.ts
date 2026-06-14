'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireYcAdmin } from '@/lib/yc/session'
import { adjustGroupPoints } from '@/lib/yc/points'
import { setYcSetting } from '@/lib/yc/settings'
import { YC_SETTING_KEYS } from '@/lib/yc/constants'
import { adminForceOpenQuiz, buildEmergencyStatus } from '@/lib/yc/emergency'

export async function adjustPoints(groupId: string, delta: number) {
  await requireYcAdmin()
  await adjustGroupPoints(groupId, delta)
  revalidatePath('/yc/admin')
  revalidatePath('/yc/admin/leaderboard')
  return { ok: true }
}

export async function updateSettingUrl(key: 'rundown' | 'kamar', url: string) {
  await requireYcAdmin()
  const settingKey =
    key === 'rundown' ? YC_SETTING_KEYS.rundownPdfUrl : YC_SETTING_KEYS.kamarPdfUrl
  await setYcSetting(settingKey, url)
  revalidatePath(`/yc/admin/settings/${key === 'rundown' ? 'rundown' : 'kamar'}`)
  return { ok: true }
}

export async function forceOpenQuiz(groupId: string, challengeSlug: string) {
  await requireYcAdmin()
  const challenge = await prisma.ycChallenge.findUnique({ where: { slug: challengeSlug } })
  if (!challenge) return { error: 'Challenge tidak ditemukan' }

  await adminForceOpenQuiz(groupId, challenge.id)

  revalidatePath('/yc/admin/emergency')
  return { ok: true }
}

export async function resetTeamSession(groupId: string, challengeSlug: string) {
  await requireYcAdmin()
  const challenge = await prisma.ycChallenge.findUnique({ where: { slug: challengeSlug } })
  if (!challenge) return { error: 'Challenge tidak ditemukan' }

  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { groupId_challengeId: { groupId, challengeId: challenge.id } },
  })
  if (session) {
    await prisma.ycTeamReadyCheck.deleteMany({ where: { sessionId: session.id } })
    await prisma.ycQuizAttempt.deleteMany({ where: { sessionId: session.id } })
    await prisma.ycTeamChallengeSession.update({
      where: { id: session.id },
      data: {
        status: 'EXPLORING',
        emergencyCalledAt: null,
        completedAt: null,
        retryAvailableAt: null,
        currentQuestionId: null,
        quizOpenedAt: null,
        triggeredByParticipantId: null,
      },
    })
  }

  revalidatePath('/yc/admin/emergency')
  return { ok: true }
}

export async function getAdminEmergencySessions() {
  await requireYcAdmin()
  const sessions = await prisma.ycTeamChallengeSession.findMany({
    where: { status: { not: 'EXPLORING' } },
    include: {
      group: true,
      challenge: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const enriched = await Promise.all(
    sessions.map(async s => {
      const status = await buildEmergencyStatus(s.groupId, s.challenge.slug)
      return {
        id: s.id,
        groupName: s.group.name,
        groupSlug: s.group.slug,
        challengeTitle: s.challenge.title,
        challengeSlug: s.challenge.slug,
        groupId: s.groupId,
        status: s.status,
        emergencyStatus: status,
      }
    }),
  )

  return enriched
}

export async function getAdminStats() {
  await requireYcAdmin()
  const [participants, groups, pendingChallenge, pendingGallery] = await Promise.all([
    prisma.ycParticipant.count(),
    prisma.ycGroup.count(),
    prisma.ycChallengeSubmission.count({ where: { status: 'PENDING' } }),
    prisma.ycGalleryUpload.count({ where: { status: 'PENDING_REVIEW' } }),
  ])
  return { participants, groups, pending: pendingChallenge + pendingGallery }
}
