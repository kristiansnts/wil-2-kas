'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireYcAdmin } from '@/lib/yc/session'
import { addGroupPoints } from '@/lib/yc/points'

export async function approveSubmission(submissionId: string) {
  await requireYcAdmin()

  const sub = await prisma.ycChallengeSubmission.findUnique({
    where: { id: submissionId },
    include: { challenge: true },
  })
  if (!sub || sub.status !== 'PENDING') return { error: 'Submission tidak valid' }

  const points = sub.challenge.points
  await prisma.ycChallengeSubmission.update({
    where: { id: submissionId },
    data: { status: 'APPROVED', pointsAwarded: points, reviewedAt: new Date() },
  })

  if (sub.groupId) await addGroupPoints(sub.groupId, points)

  revalidatePath('/yc/admin/submissions')
  revalidatePath('/yc/admin')
  return { ok: true }
}

export async function rejectSubmission(submissionId: string) {
  await requireYcAdmin()

  await prisma.ycChallengeSubmission.update({
    where: { id: submissionId },
    data: { status: 'REJECTED', reviewedAt: new Date() },
  })

  revalidatePath('/yc/admin/submissions')
  revalidatePath('/yc/admin')
  return { ok: true }
}
