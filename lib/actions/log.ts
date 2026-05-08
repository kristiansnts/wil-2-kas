'use server'

import { prisma } from '@/lib/prisma'

export async function getLogFilters() {
  const divisions = await prisma.division.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  return { divisions }
}

export async function getLogs(divisionId?: string) {
  const logs = await prisma.activityLog.findMany({
    where: divisionId ? { divisionId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const divIds = [...new Set(logs.map(l => l.divisionId).filter((id): id is string => id !== null))]
  const divisions = divIds.length > 0
    ? await prisma.division.findMany({ where: { id: { in: divIds } }, select: { id: true, name: true } })
    : []
  const divMap = new Map(divisions.map(d => [d.id, d.name]))

  return logs.map(l => ({
    ...l,
    divisionName: l.divisionId ? (divMap.get(l.divisionId) ?? null) : null,
  }))
}
