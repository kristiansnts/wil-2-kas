import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import SubmissionLogClient from '@/components/super-admin/SubmissionLogClient'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const submissions = await prisma.pastorSubmission.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      pastor: { select: { name: true, title: true } },
      meeting: { select: { month: true } },
    },
  })

  const meetings = await prisma.meeting.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, month: true },
  })

  const data = submissions.map(s => ({
    id: s.id,
    pastorName: s.pastor.name,
    pastorTitle: s.pastor.title,
    meetingId: s.meetingId,
    meetingMonth: s.meeting.month,
    persepuluhan: s.persepuluhan,
    bulan: s.bulan,
    status: s.status,
    ipAddress: s.ipAddress ?? 'unknown',
    submittedAt: s.submittedAt.toISOString(),
  }))

  return <SubmissionLogClient submissions={data} meetings={meetings} />
}
