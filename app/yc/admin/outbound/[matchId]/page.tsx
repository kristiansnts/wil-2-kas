import { notFound } from 'next/navigation'
import OutboundMatchClient from '@/components/yc/admin/OutboundMatchClient'
import { getOutboundMatch } from '@/lib/yc/actions/outbound'
import { requireYcAdmin } from '@/lib/yc/session'

export default async function OutboundMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  await requireYcAdmin()
  const { matchId } = await params
  const match = await getOutboundMatch(matchId)
  if (!match) notFound()
  return <OutboundMatchClient match={match} />
}
