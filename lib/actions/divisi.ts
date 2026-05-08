'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { fmtShort } from '@/lib/format'

export async function getDivisionData(id: string) {
  const division = await prisma.division.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { date: 'desc' } },
      events: { orderBy: { date: 'asc' } },
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
