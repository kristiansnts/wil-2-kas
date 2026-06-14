import SubmissionsClient from '@/components/yc/admin/SubmissionsClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { prisma } from '@/lib/prisma'
import { listPendingGalleryForAdmin } from '@/lib/yc/documentation'

export default async function SubmissionsPage() {
  await requireYcAdmin()

  const [rows, galleryRows, formSubmissionCount] = await Promise.all([
    prisma.ycChallengeSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        challenge: true,
        participant: true,
        group: true,
      },
      orderBy: { submittedAt: 'desc' },
    }),
    listPendingGalleryForAdmin(),
    prisma.ycFormSubmission.count(),
  ])

  const submissions = rows.map(s => ({
    id: s.id,
    answerText: s.answerText,
    mediaUrl: s.mediaUrl,
    status: s.status,
    submittedAt: s.submittedAt.toISOString(),
    participantName: s.participant?.name ?? null,
    challengeTitle: s.challenge.title,
    groupName: s.group?.name ?? null,
  }))

  const galleryPending = galleryRows.map(g => ({
    id: g.id,
    caption: g.caption,
    mediaUrl: g.mediaUrl,
    originalFilename: g.originalFilename,
    uploadType: g.uploadType,
    uploadedAt: g.uploadedAt.toISOString(),
    participantName: g.participant?.name ?? null,
    groupName: g.group?.name ?? null,
  }))

  return (
    <SubmissionsClient
      submissions={submissions}
      galleryPending={galleryPending}
      formSubmissionCount={formSubmissionCount}
    />
  )
}
