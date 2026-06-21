import AdminDashboardClient from '@/components/yc/admin/AdminDashboardClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { getAdminStats } from '@/lib/yc/actions/admin'
import { getAdminRankings } from '@/lib/yc/admin-rankings'

export default async function YcAdminPage() {
  await requireYcAdmin()
  const [stats, rankings] = await Promise.all([getAdminStats(), getAdminRankings()])

  return <AdminDashboardClient stats={stats} rankings={rankings} />
}
