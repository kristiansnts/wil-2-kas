import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMeetings } from '@/lib/actions/meeting'
import PertemuanClient from '@/components/pertemuan/PertemuanClient'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const meetings = await getMeetings()
  return <PertemuanClient meetings={meetings} />
}
