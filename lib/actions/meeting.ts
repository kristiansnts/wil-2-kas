'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { MeetingItem, MeetingDetailData, SubmissionItem, WadahEntryItem, SetorBantuanItem, PastorTitle } from '@/lib/types'

export async function getMeetings(): Promise<MeetingItem[]> {
  const rows = await prisma.meeting.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { submissions: true } } },
  })
  return rows.map(r => ({
    id: r.id,
    token: r.token,
    month: r.month,
    deadline: r.deadline.toISOString(),
    status: r.status as MeetingItem['status'],
    createdAt: r.createdAt.toISOString(),
    _count: { submissions: r._count.submissions },
  }))
}

export async function createMeeting(payload: { month: string; deadline: string }): Promise<void> {
  await prisma.meeting.create({
    data: {
      month: payload.month,
      deadline: new Date(payload.deadline),
      status: 'open',
    },
  })
  revalidatePath('/pertemuan')
}

export async function closeMeeting(id: string): Promise<void> {
  await prisma.meeting.update({ where: { id }, data: { status: 'closed' } })
  revalidatePath('/pertemuan')
  revalidatePath(`/pertemuan/${id}`)
}

export async function getMeetingByToken(token: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { token },
    include: {
      submissions: { select: { pastorId: true } },
    },
  })
  if (!meeting) return null

  const [pastors, divisions] = await Promise.all([
    prisma.pastor.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } }),
    prisma.division.findMany({ orderBy: { name: 'asc' } }),
  ])

  const submittedPastorIds = new Set(meeting.submissions.map(s => s.pastorId))

  return {
    id: meeting.id,
    token: meeting.token,
    month: meeting.month,
    deadline: meeting.deadline.toISOString(),
    status: meeting.status,
    pastors: pastors.map(p => ({
      id: p.id,
      name: p.name,
      title: p.title,
      pelayanan: p.pelayanan ?? null,
      alreadySubmitted: submittedPastorIds.has(p.id),
    })),
    divisions: divisions.map(d => ({ id: d.id, name: d.name })),
  }
}

export async function getMeetingDetail(id: string): Promise<MeetingDetailData | null> {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      submissions: {
        include: {
          pastor: true,
          wadahEntries: {
            include: { submission: false },
          },
        },
        orderBy: { submittedAt: 'asc' },
      },
      setorItems: { orderBy: { id: 'asc' } },
    },
  })
  if (!meeting) return null

  const divisionIds = [...new Set(
    meeting.submissions.flatMap(s => s.wadahEntries.map(w => w.divisionId))
  )]
  const divisions = divisionIds.length
    ? await prisma.division.findMany({ where: { id: { in: divisionIds } } })
    : []
  const divMap = new Map(divisions.map(d => [d.id, d.name]))

  const totalActivePastors = await prisma.pastor.count({ where: { status: 'active' } })

  const submissions: SubmissionItem[] = meeting.submissions.map(s => ({
    id: s.id,
    pastorId: s.pastorId,
    pastorName: s.pastor.name,
    pastorTitle: s.pastor.title as PastorTitle,
    pastorPelayanan: s.pastor.pelayanan ?? null,
    persepuluhan: s.persepuluhan,
    bulan: s.bulan,
    status: s.status as SubmissionItem['status'],
    submittedAt: s.submittedAt.toISOString(),
    wadahEntries: s.wadahEntries.map(w => ({
      divisionId: w.divisionId,
      divisionName: divMap.get(w.divisionId) ?? w.divisionId,
      amount: w.amount,
    } satisfies WadahEntryItem)),
  }))

  return {
    id: meeting.id,
    token: meeting.token,
    month: meeting.month,
    deadline: meeting.deadline.toISOString(),
    status: meeting.status as MeetingDetailData['status'],
    submissions,
    allPastorCount: totalActivePastors,
    setorDate: meeting.setorDate?.toISOString() ?? null,
    setorNetAmount: meeting.setorNetAmount ?? null,
    setorItems: meeting.setorItems.map(i => ({ id: i.id, desc: i.desc, amount: i.amount } satisfies SetorBantuanItem)),
  }
}
