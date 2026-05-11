import { notFound } from 'next/navigation'
import { getDivisionData } from '@/lib/actions/divisi'
import { getSession } from '@/lib/session'
import EventListClient from '@/components/divisi/EventListClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [division, session] = await Promise.all([getDivisionData(id), getSession()])

  if (!division) notFound()

  return (
    <EventListClient
      divisionId={division.id}
      divisionName={division.name}
      readOnly={session?.role === 'admin'}
      events={division.events.map(e => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
      }))}
      transactions={division.transactions.map(t => ({
        eventId: t.eventId,
        type: t.type as 'masuk' | 'keluar',
        amount: t.amount,
      }))}
    />
  )
}
