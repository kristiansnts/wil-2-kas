'use server'

import { prisma } from '@/lib/prisma'

export async function getLaporanData(divisionId?: string) {
  const [transactions, divisions, events] = await Promise.all([
    prisma.transaction.findMany({
      where: divisionId ? { scope: 'divisi', divisionId } : undefined,
      orderBy: { date: 'desc' },
      include: {
        division: { select: { name: true } },
        event: { select: { name: true } },
      },
    }),
    prisma.division.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.event.findMany({
      where: divisionId ? { divisionId } : undefined,
      orderBy: { date: 'asc' },
      select: { id: true, name: true, divisionId: true },
    }),
  ])

  return {
    transactions: transactions.map(t => ({
      id: t.id,
      date: t.date.toISOString(),
      desc: t.desc,
      amount: t.amount,
      type: t.type as 'masuk' | 'keluar',
      scope: t.scope as 'umum' | 'divisi',
      kategori: t.kategori as 'harian' | 'event' | null,
      divisionId: t.divisionId,
      divisionName: t.division?.name ?? null,
      eventId: t.eventId,
      eventName: t.event?.name ?? null,
    })),
    divisions: divisions.map(d => ({ id: d.id, name: d.name })),
    events: events.map(e => ({ id: e.id, name: e.name, divisionId: e.divisionId })),
  }
}
