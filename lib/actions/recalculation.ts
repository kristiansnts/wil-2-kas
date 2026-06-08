'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { fmtShort } from '@/lib/format'
import type { Prisma } from '@/app/generated/prisma/client'

export type RecalculationRow = {
  id: string
  name: string
  currentBalance: number
  calculatedBalance: number
  difference: number
}

export type RecalculationPreview = {
  kasUmum: {
    currentBalance: number
    calculatedBalance: number
    difference: number
  }
  divisions: RecalculationRow[]
}

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')
}

function signedAmount(type: string, amount: number) {
  return type === 'masuk' ? amount : -amount
}

async function buildPreview(client: Prisma.TransactionClient | typeof prisma): Promise<RecalculationPreview> {
  const [kasUmum, divisions, transactions] = await Promise.all([
    client.kasUmum.findUnique({ where: { id: 'singleton' } }),
    client.division.findMany({ orderBy: { createdAt: 'asc' } }),
    client.transaction.findMany({
      select: { scope: true, type: true, amount: true, divisionId: true },
    }),
  ])

  const calculatedKasUmum = transactions
    .filter(t => t.scope === 'umum')
    .reduce((sum, t) => sum + signedAmount(t.type, t.amount), 0)

  const divisionTotals = new Map<string, number>()
  for (const txn of transactions) {
    if (txn.scope !== 'divisi' || !txn.divisionId) continue
    divisionTotals.set(
      txn.divisionId,
      (divisionTotals.get(txn.divisionId) ?? 0) + signedAmount(txn.type, txn.amount),
    )
  }

  return {
    kasUmum: {
      currentBalance: kasUmum?.balance ?? 0,
      calculatedBalance: calculatedKasUmum,
      difference: calculatedKasUmum - (kasUmum?.balance ?? 0),
    },
    divisions: divisions.map(d => {
      const calculatedBalance = divisionTotals.get(d.id) ?? 0
      return {
        id: d.id,
        name: d.name,
        currentBalance: d.balance,
        calculatedBalance,
        difference: calculatedBalance - d.balance,
      }
    }),
  }
}

export async function getRecalculationPreview() {
  await requireAdmin()
  return buildPreview(prisma)
}

export async function recalculateBalances() {
  await requireAdmin()

  const result = await prisma.$transaction(async tx => {
    const preview = await buildPreview(tx)

    await tx.kasUmum.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', balance: preview.kasUmum.calculatedBalance },
      update: { balance: preview.kasUmum.calculatedBalance },
    })

    for (const division of preview.divisions) {
      await tx.division.update({
        where: { id: division.id },
        data: { balance: division.calculatedBalance },
      })
    }

    const changedDivisions = preview.divisions.filter(d => d.difference !== 0).length
    await tx.activityLog.create({
      data: {
        action: 'ubah',
        entity: 'saldo',
        desc: `Recalculate saldo dari transaksi: Kas Umum ${fmtShort(preview.kasUmum.currentBalance)} → ${fmtShort(preview.kasUmum.calculatedBalance)}, ${changedDivisions} komisi berubah`,
        actorRole: 'admin',
        divisionId: null,
      },
    })

    return preview
  })

  revalidatePath('/')
  revalidatePath('/admin/recalculation')
  return result
}
