'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { fmtShort } from '@/lib/format'

export async function getKasUmumData() {
  const [kasUmum, divisions, transactions, logs] = await Promise.all([
    prisma.kasUmum.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', balance: 0 },
      update: {},
    }),
    prisma.division.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.transaction.findMany({
      where: { scope: 'umum' },
      orderBy: { date: 'desc' },
    }),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ])
  return { kasUmum, divisions, transactions, logs }
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
  let divName = ''
  if (isTransfer && refDivId) {
    const div = await prisma.division.findUnique({ where: { id: refDivId } })
    divName = div?.name ?? ''
    txnDesc = `Transfer ke Divisi ${divName}`
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

    await tx.activityLog.create({
      data: {
        action: 'tambah',
        entity: 'transaksi_umum',
        desc: isTransfer
          ? `Transfer ${fmtShort(amount)} ke Divisi ${divName}`
          : `${type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} ${fmtShort(amount)}: ${desc}`,
        actorRole: 'admin',
        divisionId: isTransfer && refDivId ? refDivId : null,
      },
    })
  })

  revalidatePath('/')
}

export async function addSetorMD(payload: {
  meetingId: string
  setorNetAmount: number
  date: string
  items: { desc: string; amount: number }[]
}) {
  const { meetingId, setorNetAmount, date, items } = payload

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.setorBantuan.deleteMany({ where: { meetingId } })
    await tx.meeting.update({
      where: { id: meetingId },
      data: {
        setorDate: new Date(date),
        setorNetAmount,
        setorItems: { create: items.map(i => ({ desc: i.desc, amount: i.amount })) },
      },
    })
  })

  revalidatePath('/')
  revalidatePath(`/pertemuan/${meetingId}`)
}

export async function updateTxnUmum(
  id: string,
  oldAmount: number,
  oldType: 'masuk' | 'keluar',
  payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string },
) {
  const reverseOld = oldType === 'masuk' ? -oldAmount : oldAmount
  const applyNew = payload.type === 'masuk' ? payload.amount : -payload.amount

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.kasUmum.update({
      where: { id: 'singleton' },
      data: { balance: { increment: reverseOld + applyNew } },
    })
    await tx.transaction.update({
      where: { id },
      data: { type: payload.type, amount: payload.amount, desc: payload.desc, date: new Date(payload.date) },
    })
    await tx.activityLog.create({
      data: {
        action: 'ubah',
        entity: 'transaksi_umum',
        desc: `Ubah transaksi menjadi ${payload.type === 'masuk' ? 'pemasukan' : 'pengeluaran'} ${fmtShort(payload.amount)}: ${payload.desc}`,
        actorRole: 'admin',
        divisionId: null,
      },
    })
  })

  revalidatePath('/')
}

export async function deleteTxnUmum(
  id: string,
  amount: number,
  type: 'masuk' | 'keluar',
  refDivId: string | null,
) {
  const delta = type === 'masuk' ? -amount : amount

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.kasUmum.update({
      where: { id: 'singleton' },
      data: { balance: { increment: delta } },
    })
    await tx.transaction.delete({ where: { id } })

    if (refDivId) {
      const mirror = await tx.transaction.findFirst({
        where: { divisionId: refDivId, scope: 'divisi', type: 'masuk', amount, desc: 'Transfer dari Kas Umum' },
        orderBy: { createdAt: 'desc' },
      })
      // Only reverse division balance if the mirror still exists — if it was already
      // deleted from the divisi side, that deletion already corrected the balance.
      if (mirror) {
        await tx.division.update({
          where: { id: refDivId },
          data: { balance: { decrement: amount } },
        })
        await tx.transaction.delete({ where: { id: mirror.id } })
      }
    }

    await tx.activityLog.create({
      data: {
        action: 'hapus',
        entity: 'transaksi_umum',
        desc: refDivId
          ? `Hapus transfer ${fmtShort(amount)} ke komisi`
          : `Hapus ${type === 'masuk' ? 'pemasukan' : 'pengeluaran'} ${fmtShort(amount)}`,
        actorRole: 'admin',
        divisionId: refDivId,
      },
    })
  })

  revalidatePath('/')
}

export async function updateDivision(id: string, name: string) {
  await prisma.division.update({ where: { id }, data: { name } })
  revalidatePath('/')
}

export async function deleteDivision(id: string) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const div = await tx.division.findUnique({ where: { id } })
    if (!div) return

    if (div.balance !== 0) {
      await tx.kasUmum.update({
        where: { id: 'singleton' },
        data: { balance: { increment: div.balance } },
      })
    }
    await tx.transaction.deleteMany({ where: { divisionId: id } })
    await tx.division.delete({ where: { id } })
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
    await tx.activityLog.create({
      data: {
        action: 'tambah',
        entity: 'komisi',
        desc: `Buat komisi baru: ${name}${initialBalance > 0 ? ` (saldo awal ${fmtShort(initialBalance)})` : ''}`,
        actorRole: 'admin',
        divisionId: null,
      },
    })
  })

  revalidatePath('/')
}
