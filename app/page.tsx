import { getKasUmumData } from '@/lib/actions/kas'
import { prisma } from '@/lib/prisma'
import KasUmumClient from '@/components/kas/KasUmumClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [{ kasUmum, divisions, transactions }, meetings] = await Promise.all([
    getKasUmumData(),
    prisma.meeting.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: { where: { status: 'approved' }, select: { persepuluhan: true } },
        setorItems: { orderBy: { id: 'asc' } },
      },
    }),
  ])

  return (
    <KasUmumClient
      balance={kasUmum.balance}
      divisions={divisions.map(d => ({ id: d.id, name: d.name, balance: d.balance }))}
      transactions={transactions.map(t => ({
        id: t.id,
        date: t.date.toISOString(),
        desc: t.desc,
        amount: t.amount,
        type: t.type as 'masuk' | 'keluar',
        refDivId: t.refDivId,
      }))}
      meetings={meetings.map(m => ({
        id: m.id,
        month: m.month,
        totalPersepuluhan: m.submissions.reduce((sum, s) => sum + s.persepuluhan, 0),
        setorDate: m.setorDate?.toISOString() ?? null,
        setorNetAmount: m.setorNetAmount ?? null,
        setorItems: m.setorItems.map(i => ({ id: i.id, desc: i.desc, amount: i.amount })),
      }))}
    />
  )
}
