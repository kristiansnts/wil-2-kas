import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPastors } from '@/lib/actions/pastor'
import PastorClient from '@/components/pastor/PastorClient'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const pastors = await getPastors()

  return (
    <PastorClient
      pastors={pastors.map(p => ({
        id: p.id,
        name: p.name,
        title: p.title as 'pdp' | 'pdm' | 'pdt',
        status: p.status as 'active' | 'inactive' | 'on_hold',
        pelayanan: p.pelayanan ?? null,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  )
}
