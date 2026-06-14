import LeaderboardClient from '@/components/yc/admin/LeaderboardClient'
import { requireYcAdmin } from '@/lib/yc/session'
import { getLeaderboard } from '@/lib/yc/points'

export default async function LeaderboardPage() {
  await requireYcAdmin()
  const entries = await getLeaderboard()
  return <LeaderboardClient entries={entries} />
}
