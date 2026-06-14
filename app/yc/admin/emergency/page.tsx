import EmergencyMonitorClient from '@/components/yc/admin/EmergencyMonitorClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { getAdminEmergencySessions } from '@/lib/yc/actions/admin'

export default async function EmergencyAdminPage() {
  await requireYcAdmin()
  const sessions = await getAdminEmergencySessions()
  return <EmergencyMonitorClient sessions={sessions} />
}
