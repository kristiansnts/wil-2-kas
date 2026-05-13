import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMeetingDetail } from '@/lib/actions/meeting'
import MeetingDetailClient from '@/components/pertemuan/MeetingDetailClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id } = await params
  const meeting = await getMeetingDetail(id)
  if (!meeting) notFound()

  return <MeetingDetailClient meeting={meeting} />
}
