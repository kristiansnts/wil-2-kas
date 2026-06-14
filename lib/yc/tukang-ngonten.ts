import { prisma } from '@/lib/prisma'
import { YC_TUKANG_NGONTEN_SLUG } from './constants'
import { addGroupPoints } from './points'

type AwardInput = {
  participantId: string
  groupId: string | null
  uploadType: 'personal' | 'group'
  mediaUrl: string
  driveFileId: string | null
  caption: string | null
}

/** Called when panitia approves a gallery upload */
export async function awardTukangNgontenOnApproval(input: AwardInput) {
  const challenge = await prisma.ycChallenge.findUnique({
    where: { slug: YC_TUKANG_NGONTEN_SLUG },
  })
  if (!challenge?.isActive) return null

  const isGroup = input.uploadType === 'group'
  if (isGroup && !input.groupId) throw new Error('Kamu belum masuk kelompok')

  const points = challenge.points

  const submission = await prisma.ycChallengeSubmission.create({
    data: {
      challengeId: challenge.id,
      participantId: input.participantId,
      groupId: isGroup ? input.groupId : null,
      answerText: input.caption,
      mediaUrl: input.mediaUrl,
      driveFileId: input.driveFileId,
      status: 'APPROVED',
      pointsAwarded: points,
      reviewedAt: new Date(),
    },
  })

  if (isGroup && input.groupId) {
    await addGroupPoints(input.groupId, points)
  }

  return {
    submissionId: submission.id,
    pointsAwarded: points,
    pointTarget: isGroup ? ('group' as const) : ('individual' as const),
  }
}
