'use client'

import Link from 'next/link'
import { GroupIcon } from '@/components/yc/GroupIcon'
import { YC_BRAND } from '@/lib/yc/constants'
import { ycLogout } from '@/lib/yc/actions/auth'
import type { YcAdminGroupRank, YcAdminParticipantRank, YcAdminRankings } from '@/lib/yc/types'

function ParticipantRankRow({ entry }: { entry: YcAdminParticipantRank }) {
  return (
    <div className="txn-row">
      <div className="div-avatar">{entry.name[0] ?? '?'}</div>
      <div className="txn-info">
        <div className="txn-desc">
          #{entry.rank} {entry.name}
        </div>
        <div className="txn-meta">
          {entry.groupName ?? 'Tanpa kelompok'}
          {entry.count != null ? ` · ${entry.count} entri` : ''}
        </div>
      </div>
      <div className="txn-amount masuk">{entry.points}</div>
    </div>
  )
}

function GroupRankRow({ entry }: { entry: YcAdminGroupRank }) {
  return (
    <div className="txn-row">
      <GroupIcon name={entry.name} slug={entry.slug} size={40} />
      <div className="txn-info">
        <div className="txn-desc">
          #{entry.rank} {entry.name}
        </div>
        {entry.detail ? <div className="txn-meta">{entry.detail}</div> : null}
      </div>
      <div className="txn-amount masuk">{entry.points}</div>
    </div>
  )
}

function RankCard({
  title,
  subtitle,
  emptyText,
  children,
}: {
  title: string
  subtitle: string
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div className="yc-admin-rank-card">
      <div className="section-header yc-admin-rank-header">
        <div>
          <div className="section-title">{title}</div>
          <div className="yc-admin-rank-sub">{subtitle}</div>
        </div>
      </div>
      <div className="card">{children ?? <div className="empty-text yc-admin-rank-empty">{emptyText}</div>}</div>
    </div>
  )
}

export default function AdminDashboardClient({
  stats,
  rankings,
}: {
  stats: { participants: number; groups: number; pending: number }
  rankings: YcAdminRankings
}) {
  const links = [
    { href: '/yc/admin/outbound', label: 'Outbound', icon: '🎯' },
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

        <div className="section-header">
          <div className="section-title">Top 3 per Challenge</div>
          <Link href="/yc/admin/leaderboard" className="yc-admin-rank-link">
            Leaderboard total
          </Link>
        </div>

        <div className="yc-admin-rankings">
          <RankCard
            title="Tukang Ngonten"
            subtitle="Upload personal · per peserta"
            emptyText="Belum ada upload personal disetujui"
          >
            {rankings.tukangNgonten.length > 0
              ? rankings.tukangNgonten.map(e => <ParticipantRankRow key={e.id} entry={e} />)
              : null}
          </RankCard>

          <RankCard
            title="Si Paling Extrovert"
            subtitle="Cerita name tag · per peserta"
            emptyText="Belum ada pasangan selesai"
          >
            {rankings.extrovert.length > 0
              ? rankings.extrovert.map(e => <ParticipantRankRow key={e.id} entry={e} />)
              : null}
          </RankCard>

          <RankCard
            title="Outbound Challenge"
            subtitle="Menang game + tebakan · per kelompok"
            emptyText="Belum ada data outbound"
          >
            {rankings.outbound.length > 0
              ? rankings.outbound.map(e => <GroupRankRow key={e.id} entry={e} />)
              : null}
          </RankCard>

          <RankCard
            title="Tim — Harta Karun & Upload"
            subtitle="Fragment treasure hunt + upload kelompok"
            emptyText="Belum ada poin tim dari challenge ini"
          >
            {rankings.teamActivity.length > 0
              ? rankings.teamActivity.map(e => <GroupRankRow key={e.id} entry={e} />)
              : null}
          </RankCard>
        </div>
      </div>
    </div>
  )
}
