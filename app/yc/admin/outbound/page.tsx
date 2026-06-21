import OutboundListClient from '@/components/yc/admin/OutboundListClient'
import OutboundPosSetupClient from '@/components/yc/admin/OutboundPosSetupClient'
import { getOutboundMatches } from '@/lib/yc/actions/outbound'
import { getOutboundPosition } from '@/lib/yc/outbound-session'
import { requireYcAdmin } from '@/lib/yc/session'

export default async function OutboundAdminPage() {
  await requireYcAdmin()
  const position = await getOutboundPosition()
  if (!position) return <OutboundPosSetupClient />

  const matches = await getOutboundMatches(position)
  return <OutboundListClient matches={matches} position={position} />
}
