'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function getKasUmumData() {
  const [kasUmum, divisions, transactions] = await Promise.all([
    prisma.kasUmum.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', balance: 0 },
      update: {},
    }),
    prisma.division.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.transaction.findMany({
      where: { scope: 'umum' },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ])
  return { kasUmum, divisions, transactions }
}

export async function addTxnUmum(payload: {
  type: 'masuk' | 'keluar'
  amount: number
  desc: string
  date: string
  isTransfer: boolean
  refDivId?: string
}) {
  const { type, amount, desc, date, isTransfer, refDivId } = payload
  const delta = type === 'masuk' ? amount : -amount

  let txnDesc = desc
  if (isTransfer && refDivId) {
    const div = await prisma.division.findUnique({ where: { id: refDivId } })
    txnDesc = `Transfer ke Divisi ${div?.name ?? ''}`
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.kasUmum.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', balance: delta },
      update: { balance: { increment: delta } },
    })

    await tx.transaction.create({
      data: {
        date: new Date(date),
        desc: txnDesc,
        amount,
        type,
        scope: 'umum',
        refDivId: isTransfer ? refDivId : null,
      },
    })

    if (isTransfer && refDivId) {
      await tx.division.update({
        where: { id: refDivId },
        data: { balance: { increment: amount } },
      })
      await tx.transaction.create({
        data: {
          date: new Date(date),
          desc: 'Transfer dari Kas Umum',
          amount,
          type: 'masuk',
          scope: 'divisi',
          kategori: 'harian',
          divisionId: refDivId,
        },
      })
    }
  })

  revalidatePath('/')
}

export async function addDivision(payload: { name: string; initialBalance: number }) {
  const { name, initialBalance } = payload

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.division.create({
      data: { name, balance: initialBalance },
    })
    if (initialBalance > 0) {
      await tx.kasUmum.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', balance: -initialBalance },
        update: { balance: { decrement: initialBalance } },
      })
    }
  })

  revalidatePath('/')
}
