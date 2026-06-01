'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { fmtShort } from '@/lib/format'
import { getSession } from '@/lib/session'

async function requireDivisi() {
  const session = await getSession()
  if (!session || session.role !== 'division') throw new Error('Unauthorized')
}

function rupiah(v: FormDataEntryValue | null): number {
  return parseInt(String(v ?? '').replace(/\D/g, '')) || 0
}
function str(v: FormDataEntryValue | null): string {
  return String(v ?? '').trim()
}

export async function getDivisionData(id: string) {
  const division = await prisma.division.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { date: 'desc' } },
      events: { orderBy: { date: 'desc' } },
    },
  })
  if (!division) return null
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return { ...division, logs }
}

export async function addTxnDivisi(payload: {
  divisionId: string
  type: 'masuk' | 'keluar'
  kategori: 'harian' | 'event'
  eventId?: string
  amount: number
  desc: string
  date: string
}) {
  await requireDivisi()
  const { divisionId, type, kategori, eventId, amount, desc, date } = payload
  const delta = type === 'masuk' ? amount : -amount

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.division.update({
      where: { id: divisionId },
      data: { balance: { increment: delta } },
    })
    await tx.transaction.create({
      data: {
        date: new Date(date),
        desc,
        amount,
        type,
        scope: 'divisi',
        kategori,
        divisionId,
        eventId: kategori === 'event' && eventId ? eventId : null,
      },
    })
    await tx.activityLog.create({
      data: {
        action: 'tambah',
        entity: 'transaksi_divisi',
        desc: `${type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} ${fmtShort(amount)}: ${desc}`,
        actorRole: 'division',
        divisionId,
      },
    })
  })

  revalidatePath(`/divisi/${divisionId}`)
}

export async function updateTxnDivisi(
  id: string,
  divisionId: string,
  oldAmount: number,
  oldType: 'masuk' | 'keluar',
  payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string; kategori: 'harian' | 'event'; eventId?: string },
) {
  await requireDivisi()
  const reverseOld = oldType === 'masuk' ? -oldAmount : oldAmount
  const applyNew = payload.type === 'masuk' ? payload.amount : -payload.amount

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.division.update({
      where: { id: divisionId },
      data: { balance: { increment: reverseOld + applyNew } },
    })
    await tx.transaction.update({
      where: { id },
      data: {
        type: payload.type,
        amount: payload.amount,
        desc: payload.desc,
        date: new Date(payload.date),
        kategori: payload.kategori,
        eventId: payload.kategori === 'event' && payload.eventId ? payload.eventId : null,
      },
    })
    await tx.activityLog.create({
      data: {
        action: 'ubah',
        entity: 'transaksi_divisi',
        desc: `Ubah transaksi menjadi ${payload.type === 'masuk' ? 'pemasukan' : 'pengeluaran'} ${fmtShort(payload.amount)}: ${payload.desc}`,
        actorRole: 'division',
        divisionId,
      },
    })
  })

  revalidatePath(`/divisi/${divisionId}`)
}

export async function deleteTxnDivisi(id: string, divisionId: string, amount: number, type: 'masuk' | 'keluar') {
  await requireDivisi()
  const delta = type === 'masuk' ? -amount : amount

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.transaction.delete({ where: { id } })
    await tx.division.update({
      where: { id: divisionId },
      data: { balance: { increment: delta } },
    })
    await tx.activityLog.create({
      data: {
        action: 'hapus',
        entity: 'transaksi_divisi',
        desc: `Hapus ${type === 'masuk' ? 'pemasukan' : 'pengeluaran'} ${fmtShort(amount)}`,
        actorRole: 'division',
        divisionId,
      },
    })
  })

  revalidatePath('/')
  revalidatePath(`/divisi/${divisionId}`)
}

export async function addEvent(payload: {
  divisionId: string
  name: string
  date: string
}) {
  await requireDivisi()
  const { divisionId, name, date } = payload

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.event.create({
      data: { name, date: new Date(date), divisionId },
    })
    await tx.activityLog.create({
      data: {
        action: 'tambah',
        entity: 'event',
        desc: `Buat event baru: ${name}`,
        actorRole: 'division',
        divisionId,
      },
    })
  })

  revalidatePath(`/divisi/${divisionId}`)
}

export async function updateEvent(id: string, divisionId: string, name: string, date: string) {
  await requireDivisi()
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.event.update({ where: { id }, data: { name, date: new Date(date) } })
    await tx.activityLog.create({
      data: {
        action: 'ubah',
        entity: 'event',
        desc: `Ubah event: ${name}`,
        actorRole: 'division',
        divisionId,
      },
    })
  })
  revalidatePath(`/divisi/${divisionId}`)
}

export async function deleteEvent(id: string, divisionId: string) {
  await requireDivisi()
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const event = await tx.event.findUnique({ where: { id }, select: { name: true } })
    await tx.transaction.updateMany({ where: { eventId: id }, data: { eventId: null } })
    await tx.event.delete({ where: { id } })
    await tx.activityLog.create({
      data: {
        action: 'hapus',
        entity: 'event',
        desc: `Hapus event: ${event?.name ?? ''}`,
        actorRole: 'division',
        divisionId,
      },
    })
  })
  revalidatePath(`/divisi/${divisionId}`)
}

// ---- FormData form actions (used by /divisi/[id]/* fallback pages) ----

export async function addTxnDivisiForm(formData: FormData) {
  const divisionId = str(formData.get('divisionId'))
  const amount = rupiah(formData.get('amount'))
  const eventId = str(formData.get('eventId'))
  if (!amount || !divisionId) redirect(`/divisi/${divisionId}`)
  await addTxnDivisi({
    divisionId,
    type: str(formData.get('type')) as 'masuk' | 'keluar',
    kategori: eventId ? 'event' : 'harian',
    eventId: eventId || undefined,
    amount,
    desc: str(formData.get('desc')),
    date: str(formData.get('date')),
  })
  redirect(`/divisi/${divisionId}`)
}

export async function updateTxnDivisiForm(formData: FormData) {
  const id = str(formData.get('id'))
  const divisionId = str(formData.get('divisionId'))
  const amount = rupiah(formData.get('amount'))
  const eventId = str(formData.get('eventId'))
  const existing = await prisma.transaction.findUnique({ where: { id } })
  if (!existing || !amount) redirect(`/divisi/${divisionId}`)
  await updateTxnDivisi(id, divisionId, existing.amount, existing.type as 'masuk' | 'keluar', {
    type: str(formData.get('type')) as 'masuk' | 'keluar',
    amount,
    desc: str(formData.get('desc')),
    date: str(formData.get('date')),
    kategori: eventId ? 'event' : 'harian',
    eventId: eventId || undefined,
  })
  redirect(`/divisi/${divisionId}`)
}

export async function deleteTxnDivisiForm(formData: FormData) {
  const id = str(formData.get('id'))
  const divisionId = str(formData.get('divisionId'))
  const existing = await prisma.transaction.findUnique({ where: { id } })
  if (existing) {
    await deleteTxnDivisi(id, divisionId, existing.amount, existing.type as 'masuk' | 'keluar')
  }
  redirect(`/divisi/${divisionId}`)
}

export async function addEventForm(formData: FormData) {
  const divisionId = str(formData.get('divisionId'))
  const name = str(formData.get('name'))
  if (!name || !divisionId) redirect(`/divisi/${divisionId}`)
  await addEvent({ divisionId, name, date: str(formData.get('date')) })
  redirect(`/divisi/${divisionId}/event`)
}

export async function updateEventForm(formData: FormData) {
  const id = str(formData.get('id'))
  const divisionId = str(formData.get('divisionId'))
  const name = str(formData.get('name'))
  if (!name) redirect(`/divisi/${divisionId}/event`)
  await updateEvent(id, divisionId, name, str(formData.get('date')))
  redirect(`/divisi/${divisionId}/event`)
}

export async function deleteEventForm(formData: FormData) {
  const id = str(formData.get('id'))
  const divisionId = str(formData.get('divisionId'))
  await deleteEvent(id, divisionId)
  redirect(`/divisi/${divisionId}/event`)
}
