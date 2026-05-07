import { notFound } from 'next/navigation'
import { getDivisionData } from '@/lib/actions/divisi'
import { getSession } from '@/lib/session'
import DivisiClient from '@/components/divisi/DivisiClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [division, session] = await Promise.all([getDivisionData(id), getSession()])

  if (!division) notFound()

  return (
    <DivisiClient
      readOnly={session?.role === 'admin'}
      division={{
        id: division.id,
        name: division.name,
        balance: division.balance,
        transactions: division.transactions.map(t => ({
          id: t.id,
          date: t.date.toISOString(),
          desc: t.desc,
          amount: t.amount,
          type: t.type as 'masuk' | 'keluar',
          kategori: t.kategori as 'harian' | 'event' | null,
          eventId: t.eventId,
        })),
        events: division.events.map(e => ({
          id: e.id,
          name: e.name,
          date: e.date.toISOString(),
        })),
      }}
    />
  )
}
