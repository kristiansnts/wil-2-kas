'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

export async function getPastors() {
  return prisma.pastor.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function addPastor(payload: { name: string; title: string; status: string; pelayanan: string | null }) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.pastor.create({ data: payload })
    await tx.activityLog.create({
      data: {
        action: 'tambah',
        entity: 'pastor',
        desc: `Tambah pendeta: ${payload.name} (${TITLE_LABEL[payload.title] ?? payload.title})`,
        actorRole: 'admin',
        divisionId: null,
      },
    })
  })
  revalidatePath('/pastor')
}

export async function updatePastor(id: string, payload: { name: string; title: string; status: string; pelayanan: string | null }) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.pastor.update({ where: { id }, data: payload })
    await tx.activityLog.create({
      data: {
        action: 'ubah',
        entity: 'pastor',
        desc: `Ubah pendeta: ${payload.name} (${TITLE_LABEL[payload.title] ?? payload.title})`,
        actorRole: 'admin',
        divisionId: null,
      },
    })
  })
  revalidatePath('/pastor')
}

export async function deletePastor(id: string) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const pastor = await tx.pastor.findUnique({ where: { id }, select: { name: true, title: true } })
    await tx.pastor.delete({ where: { id } })
    await tx.activityLog.create({
      data: {
        action: 'hapus',
        entity: 'pastor',
        desc: `Hapus pendeta: ${pastor?.name ?? ''} (${TITLE_LABEL[pastor?.title ?? ''] ?? pastor?.title ?? ''})`,
        actorRole: 'admin',
        divisionId: null,
      },
    })
  })
  revalidatePath('/pastor')
}
