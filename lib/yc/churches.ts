import { prisma } from '@/lib/prisma'

export function formatChurchLabel(raw: string): string {
  return raw.startsWith('GPdI') ? raw : `GPdI ${raw}`
}

export async function listChurchOptions(): Promise<{ value: string; label: string }[]> {
  const rows = await prisma.pastor.findMany({
    where: { pelayanan: { not: null } },
    select: { pelayanan: true },
    distinct: ['pelayanan'],
    orderBy: { pelayanan: 'asc' },
  })

  return rows
    .map(r => r.pelayanan!)
    .filter(Boolean)
    .map(value => ({ value, label: formatChurchLabel(value) }))
}
