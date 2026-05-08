import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getLaporanData } from '@/lib/actions/laporan'
import LaporanClient from '@/components/laporan/LaporanClient'

export default async function LaporanPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const divisionId = session.role === 'division' ? session.divisionId : undefined
  const { transactions, divisions, events } = await getLaporanData(divisionId)

  return (
    <LaporanClient
      transactions={transactions}
      divisions={divisions}
      events={events}
      isAdmin={session.role === 'admin'}
      fixedDivisionId={divisionId ?? null}
    />
  )
}
