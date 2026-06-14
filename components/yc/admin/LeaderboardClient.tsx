'use client'

import { FormShell } from '@/components/forms/FormShell'
import { GroupIcon } from '@/components/yc/GroupIcon'
import type { YcLeaderboardEntry } from '@/lib/yc/types'

export default function LeaderboardClient({ entries }: { entries: YcLeaderboardEntry[] }) {
  return (
    <FormShell title="Leaderboard" back="/yc/admin">
      <div className="card">
        {entries.map(e => (
          <div key={e.id} className="txn-row">
            <GroupIcon name={e.name} slug={e.slug} size={40} />
            <div className="txn-info">
              <div className="txn-desc">#{e.rank} {e.name}</div>
              <div className="txn-meta">{e.memberCount} anggota</div>
            </div>
            <div className="txn-amount masuk">{e.points}</div>
          </div>
        ))}
      </div>
    </FormShell>
  )
}
