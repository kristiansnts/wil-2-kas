import AdminDashboardClient from '@/components/yc/admin/AdminDashboardClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { getAdminStats } from '@/lib/yc/actions/admin'
import { getLeaderboard } from '@/lib/yc/points'

export default async function YcAdminPage() {
  await requireYcAdmin()
  const [stats, leaderboard] = await Promise.all([getAdminStats(), getLeaderboard()])

  return <AdminDashboardClient stats={stats} leaderboard={leaderboard} />
}
