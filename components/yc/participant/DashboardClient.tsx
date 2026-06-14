'use client'

import Link from 'next/link'
import { YC_BRAND } from '@/lib/yc/constants'
import type { YcParticipantFeatureFlags, YcParticipantPublic } from '@/lib/yc/types'
import EmergencySoundToggle from '@/components/yc/participant/EmergencySoundToggle'

const MENUS = [
  { href: 'rundown', label: 'Rundown', icon: '📋', color: '#e8eeff' },
  { href: 'room', label: 'Kamar', icon: '🛏️', color: '#d6f7e6' },
  { href: 'group', label: 'Kelompok', icon: '👥', color: '#fde8e8' },
  { href: 'dokumentasi', label: 'Dokumentasi', icon: '📸', color: '#fff4e6' },
  { href: 'challenge', label: 'Challenge', icon: '🏆', color: '#f3e8ff' },
  { href: 'form', label: 'Form', icon: '📝', color: '#e0f2fe', feature: 'worshipForm' as const },
] as const

export default function DashboardClient({
  participant,
  features,
}: {
  participant: YcParticipantPublic
  features: YcParticipantFeatureFlags
}) {
  const base = `/yc/p/${participant.token}`
  const menus = MENUS.filter(m => !('feature' in m) || features[m.feature])

  return (
    <div className="screen">
      <div className="topnav">
        <div style={{ flex: 1 }}>
          <div className="topnav-title">{YC_BRAND}</div>
          <div className="topnav-sub">Dashboard Peserta</div>
        </div>
      </div>
      <div className="content">
        <div className="balance-card">
          <div className="balance-label">Selamat datang</div>
          <div className="balance-amount" style={{ fontSize: 26 }}>{participant.name}</div>
          <div className="balance-date">{participant.church}</div>
          {participant.group && (
            <div className="balance-date" style={{ marginTop: 8 }}>
              {participant.group.name} · {participant.group.points} poin
            </div>
          )}
        </div>

        {features.emergencyAlarm && <EmergencySoundToggle />}

        <div className="actions-grid">
          {menus.map(m => (
            <Link key={m.href} href={`${base}/${m.href}`} className="action-btn">
              <div className="action-icon" style={{ background: m.color }}>{m.icon}</div>
              <div className="action-label">{m.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
