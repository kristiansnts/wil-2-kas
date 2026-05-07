'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function getDivisionData(id: string) {
  return prisma.division.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { date: 'desc' } },
      events: { orderBy: { date: 'asc' } },
    },
  })
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

  await prisma.event.create({
    data: { name, date: new Date(date), divisionId },
  })

  revalidatePath(`/divisi/${divisionId}`)
}
