'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { fmtShort } from '@/lib/format'

async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
}

export async function submitPastorForm(payload: {
  token: string
  pastorId: string
  persepuluhan: number
  bulan: number
  wadahEntries: { divisionId: string; amount: number }[]
}): Promise<{ ok: boolean; error?: string }> {
  const ip = await getClientIp()

  const meeting = await prisma.meeting.findUnique({ where: { token: payload.token } })
  if (!meeting) return { ok: false, error: 'Link tidak valid.' }
  if (meeting.status === 'closed') return { ok: false, error: 'Formulir sudah ditutup.' }
  if (new Date() > meeting.deadline) return { ok: false, error: 'Batas waktu pengisian sudah lewat.' }

  const [existingPastor, existingIp] = await Promise.all([
    prisma.pastorSubmission.findFirst({
      where: { meetingId: meeting.id, pastorId: payload.pastorId },
    }),
    ip !== 'unknown'
      ? prisma.pastorSubmission.findFirst({
          where: { meetingId: meeting.id, ipAddress: ip },
        })
      : Promise.resolve(null),
  ])

  if (existingPastor) return { ok: false, error: 'Anda sudah mengisi formulir ini.' }
  if (existingIp) return { ok: false, error: 'Formulir sudah diisi dari perangkat ini.' }

  await prisma.pastorSubmission.create({
    data: {
      meetingId: meeting.id,
      pastorId: payload.pastorId,
      persepuluhan: payload.persepuluhan,
      bulan: payload.bulan,
      status: 'pending',
      ipAddress: ip,
      wadahEntries: {
        create: payload.wadahEntries
          .filter(w => w.amount > 0)
          .map(w => ({ divisionId: w.divisionId, amount: w.amount })),
      },
    },
  })

  return { ok: true }
}

export async function adminAddSubmission(payload: {
  meetingId: string
  pastorId: string
  persepuluhan: number
  bulan: number
  wadahEntries: { divisionId: string; amount: number }[]
}): Promise<{ ok: boolean; error?: string }> {
  const meeting = await prisma.meeting.findUnique({ where: { id: payload.meetingId } })
  if (!meeting) return { ok: false, error: 'Pertemuan tidak ditemukan.' }

  const existing = await prisma.pastorSubmission.findFirst({
    where: { meetingId: payload.meetingId, pastorId: payload.pastorId },
  })
  if (existing) return { ok: false, error: 'Pendeta sudah mengisi.' }

  await prisma.pastorSubmission.create({
    data: {
      meetingId: payload.meetingId,
      pastorId: payload.pastorId,
      persepuluhan: payload.persepuluhan,
      bulan: payload.bulan,
      status: 'pending',
      wadahEntries: {
        create: payload.wadahEntries
          .filter(w => w.amount > 0)
          .map(w => ({ divisionId: w.divisionId, amount: w.amount })),
      },
    },
  })

  revalidatePath(`/pertemuan/${payload.meetingId}`)
  return { ok: true }
}

export async function approveSubmission(submissionId: string): Promise<void> {
  const sub = await prisma.pastorSubmission.findUnique({
    where: { id: submissionId },
    include: { pastor: true, meeting: true, wadahEntries: true },
  })
  if (!sub || sub.status === 'approved') return

  const monthLabel = fmtMonth(sub.meeting.month)
  const titleLabel = TITLE_LABEL[sub.pastor.title] ?? sub.pastor.title.toUpperCase()
  const today = new Date()

  const kas15 = Math.round(sub.persepuluhan * 0.15)

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.pastorSubmission.update({ where: { id: submissionId }, data: { status: 'approved' } })

    if (kas15 > 0) {
      await tx.kasUmum.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', balance: kas15 },
        update: { balance: { increment: kas15 } },
      })
      const desc = `Persepuluhan ${sub.pastor.name} (${titleLabel}) - ${monthLabel} (${sub.bulan} bln)`
      await tx.transaction.create({
        data: { date: today, desc, amount: kas15, type: 'masuk', scope: 'umum' },
      })
      await tx.activityLog.create({
        data: {
          action: 'tambah',
          entity: 'transaksi_umum',
          desc: `Pemasukan ${fmtShort(kas15)}: ${desc}`,
          actorRole: 'admin',
          divisionId: null,
        },
      })
    }

    for (const wadah of sub.wadahEntries) {
      await tx.division.update({
        where: { id: wadah.divisionId },
        data: { balance: { increment: wadah.amount } },
      })
      const wDesc = `Wadah ${sub.pastor.name} (${titleLabel}) - ${monthLabel}`
      await tx.transaction.create({
        data: {
          date: today,
          desc: wDesc,
          amount: wadah.amount,
          type: 'masuk',
          scope: 'divisi',
          kategori: 'harian',
          divisionId: wadah.divisionId,
        },
      })
      await tx.activityLog.create({
        data: {
          action: 'tambah',
          entity: 'transaksi_divisi',
          desc: `Pemasukan ${fmtShort(wadah.amount)}: ${wDesc}`,
          actorRole: 'admin',
          divisionId: wadah.divisionId,
        },
      })
    }
  })

  revalidatePath(`/pertemuan/${sub.meetingId}`)
  revalidatePath('/')
}

export async function editSubmission(
  submissionId: string,
  payload: {
    persepuluhan: number
    bulan: number
    wadahEntries: { divisionId: string; amount: number }[]
  },
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.wadahEntry.deleteMany({ where: { submissionId } })
    await tx.pastorSubmission.update({
      where: { id: submissionId },
      data: {
        persepuluhan: payload.persepuluhan,
        bulan: payload.bulan,
        wadahEntries: {
          create: payload.wadahEntries
            .filter(w => w.amount > 0)
            .map(w => ({ divisionId: w.divisionId, amount: w.amount })),
        },
      },
    })
  })

  const sub = await prisma.pastorSubmission.findUnique({ where: { id: submissionId } })
  if (sub) revalidatePath(`/pertemuan/${sub.meetingId}`)
}

// ---- FormData form actions (used by /pertemuan/[id]/submission/* fallback pages) ----

function rupiah(v: FormDataEntryValue | null): number {
  return parseInt(String(v ?? '').replace(/\D/g, '')) || 0
}
function str(v: FormDataEntryValue | null): string {
  return String(v ?? '').trim()
}
// Collect wadah_<divisionId> inputs into wadah entries.
function wadahFromForm(formData: FormData): { divisionId: string; amount: number }[] {
  const entries: { divisionId: string; amount: number }[] = []
  for (const [key, val] of formData.entries()) {
    if (key.startsWith('wadah_')) {
      const amount = parseInt(String(val).replace(/\D/g, '')) || 0
      if (amount > 0) entries.push({ divisionId: key.slice(6), amount })
    }
  }
  return entries
}

export async function approveSubmissionForm(formData: FormData) {
  const submissionId = str(formData.get('submissionId'))
  const meetingId = str(formData.get('meetingId'))
  await approveSubmission(submissionId)
  redirect(`/pertemuan/${meetingId}`)
}

export async function editSubmissionForm(formData: FormData) {
  const submissionId = str(formData.get('submissionId'))
  const meetingId = str(formData.get('meetingId'))
  await editSubmission(submissionId, {
    persepuluhan: rupiah(formData.get('persepuluhan')),
    bulan: parseInt(str(formData.get('bulan'))) || 1,
    wadahEntries: wadahFromForm(formData),
  })
  redirect(`/pertemuan/${meetingId}`)
}

export async function adminAddSubmissionForm(formData: FormData) {
  const meetingId = str(formData.get('meetingId'))
  const pastorId = str(formData.get('pastorId'))
  const baruUrl = `/pertemuan/${meetingId}/submission/baru`
  if (!pastorId) redirect(`${baruUrl}?error=${encodeURIComponent('Pilih pendeta terlebih dahulu.')}`)
  const result = await adminAddSubmission({
    meetingId,
    pastorId,
    persepuluhan: rupiah(formData.get('persepuluhan')),
    bulan: parseInt(str(formData.get('bulan'))) || 1,
    wadahEntries: wadahFromForm(formData),
  })
  if (!result.ok) redirect(`${baruUrl}?error=${encodeURIComponent(result.error ?? 'Gagal menyimpan.')}`)
  redirect(`/pertemuan/${meetingId}`)
}
