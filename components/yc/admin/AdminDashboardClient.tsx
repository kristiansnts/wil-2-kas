'use client'

import Link from 'next/link'
import { GroupIcon } from '@/components/yc/GroupIcon'
import { YC_BRAND } from '@/lib/yc/constants'
import { ycLogout } from '@/lib/yc/actions/auth'

export default function AdminDashboardClient({
  stats,
  leaderboard,
}: {
  stats: { participants: number; groups: number; pending: number }
  leaderboard: { rank: number; name: string; slug: string; points: number }[]
}) {
  const links = [
    { href: '/yc/admin/submissions', label: 'Submissions', icon: '📝' },
    { href: '/yc/admin/emergency', label: 'Emergency', icon: '🚨' },
    { href: '/yc/admin/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { href: '/yc/admin/settings/features', label: 'Fitur Peserta', icon: '🎛️' },
    { href: '/yc/admin/settings/rundown', label: 'Rundown PDF', icon: '📋' },
    { href: '/yc/admin/settings/kamar', label: 'Kamar PDF', icon: '🛏️' },
  ]

  return (
    <div className="screen">
      <div className="topnav">
        <div style={{ flex: 1 }}>
          <div className="topnav-title">{YC_BRAND}</div>
          <div className="topnav-sub">Admin Dashboard</div>
        </div>
        <form action={ycLogout}>
          <button type="submit" style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </form>
      </div>
      <div className="content">
        <div className="stats-row">
          <div className="stat-pill"><div className="stat-pill-label">Peserta</div><div className="stat-pill-val">{stats.participants}</div></div>
          <div className="stat-pill"><div className="stat-pill-label">Kelompok</div><div className="stat-pill-val">{stats.groups}</div></div>
          <div className="stat-pill"><div className="stat-pill-label">Pending</div><div className="stat-pill-val red">{stats.pending}</div></div>
        </div>

        <div className="actions-grid">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="action-btn">
              <div className="action-icon" style={{ background: 'var(--accent-light)' }}>{l.icon}</div>
              <div className="action-label">{l.label}</div>
            </Link>
          ))}
        </div>

        <div className="section-header"><div className="section-title">Top 5 Kelompok</div></div>
        <div className="card">
          {leaderboard.slice(0, 5).map(g => (
            <div key={g.rank} className="txn-row">
              <GroupIcon name={g.name} slug={g.slug} size={40} />
              <div className="txn-info">
                <div className="txn-desc">#{g.rank} {g.name}</div>
              </div>
              <div className="txn-amount masuk">{g.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
