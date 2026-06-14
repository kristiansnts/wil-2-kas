import { prisma } from '@/lib/prisma'

export async function addGroupPoints(groupId: string, points: number): Promise<void> {
  if (points === 0) return
  await prisma.ycGroup.update({
    where: { id: groupId },
    data: { points: { increment: points } },
  })
}

export async function adjustGroupPoints(groupId: string, delta: number): Promise<number> {
  const updated = await prisma.ycGroup.update({
    where: { id: groupId },
    data: { points: { increment: delta } },
    select: { points: true },
  })
  return updated.points
}

export async function getLeaderboard() {
  const groups = await prisma.ycGroup.findMany({
    orderBy: [{ points: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { participants: true } } },
  })

  return groups.map((g, i) => ({
    rank: i + 1,
    id: g.id,
    name: g.name,
    slug: g.slug,
    points: g.points,
    memberCount: g._count.participants,
  }))
}
