'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GroupIcon } from '@/components/yc/GroupIcon'
import { YC_BRAND } from '@/lib/yc/constants'
import { groupNameFromNum, outboundScheduleForPosition } from '@/lib/yc/outbound-data'
import type { OutboundMatchListItem } from '@/lib/yc/actions/outbound'
import { clearOutboundPosition } from '@/lib/yc/actions/outbound'
import { ycLogout } from '@/lib/yc/actions/auth'

function statusLabel(status: OutboundMatchListItem['status']) {
  if (status === 'done') return 'Selesai'
  if (status === 'guessed') return 'Tebakan tercatat'
  return 'Belum'
}

function statusClass(status: OutboundMatchListItem['status']) {
  if (status === 'done') return 'yc-outbound-badge--done'
  if (status === 'guessed') return 'yc-outbound-badge--guessed'
  return 'yc-outbound-badge--pending'
}

export default function OutboundListClient({
  matches,
  position,
}: {
  matches: OutboundMatchListItem[]
  position: number
}) {
  const router = useRouter()
  const schedule = outboundScheduleForPosition(position)

  async function handleChangePos() {
    await clearOutboundPosition()
    router.refresh()
  }

  return (
    <div className="screen">
      <div className="topnav">
        <div style={{ flex: 1 }}>
          <div className="topnav-title">{YC_BRAND}</div>
          <div className="topnav-sub">Outbound Challenge · Pos {position}</div>
        </div>
        <button type="button" onClick={handleChangePos} className="yc-outbound-nav-btn yc-outbound-nav-btn--muted">
          Ganti Pos
        </button>
        <form action={ycLogout}>
          <button type="submit" className="yc-outbound-nav-btn yc-outbound-nav-btn--accent">
            Logout
          </button>
        </form>
      </div>

      <div className="content">
        <div className="section-header yc-outbound-section" style={{ marginTop: 0 }}>
          <div className="section-title">Jadwal Pos {position}</div>
        </div>
        <div className="card yc-admin-table-wrap">
          <table className="yc-admin-table">
            <thead>
              <tr>
                <th>Ronde</th>
                <th>Pos {position}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(row => (
                <tr key={row.round}>
                  <td className="yc-admin-table-muted">{row.round}</td>
                  <td>
                    {row.teamANum} vs {row.teamBNum}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-header yc-outbound-section">
          <div className="section-title">Daftar Game · Pos {position}</div>
        </div>
        {matches.length === 0 ? (
          <div className="empty">
            <div className="empty-text">Belum ada pertandingan di pos ini. Jalankan seed YC.</div>
          </div>
        ) : (
          <div className="card">
            {matches.map(match => (
              <Link
                key={match.id}
                href={`/yc/admin/outbound/${match.id}`}
                className="txn-row yc-outbound-row"
              >
                <GroupIcon
                  name={groupNameFromNum(match.teamANum)}
                  slug={match.teamASlug}
                  size={40}
                />
                <div className="txn-info">
                  <div className="txn-desc">Ronde {match.round}</div>
                  <div className="txn-meta">
                    {groupNameFromNum(match.teamANum)} vs {groupNameFromNum(match.teamBNum)}
                  </div>
                </div>
                <span className={`yc-outbound-badge ${statusClass(match.status)}`}>
                  {statusLabel(match.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
