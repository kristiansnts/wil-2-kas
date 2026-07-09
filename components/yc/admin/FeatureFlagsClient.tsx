'use client'

import { useState } from 'react'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import { updateFeatureFlags } from '@/lib/yc/actions/admin'
import type { YcParticipantFeatureFlags } from '@/lib/yc/types'

const FEATURES: {
  key: keyof YcParticipantFeatureFlags
  label: string
  description: string
}[] = [
  {
    key: 'emergencyAlarm',
    label: 'Alarm Emergency',
    description: 'Tombol aktifkan alarm di dashboard peserta',
  },
  {
    key: 'teamChallenge',
    label: 'Team Challenge',
    description: 'Treasure hunt & emergency meeting di halaman challenge',
  },
  {
    key: 'nametagPairing',
    label: 'Nametag Pairing (Extrovert)',
    description: 'Scan name tag & auto-redirect pasangan. Matikan saat treasure hunt.',
  },
  {
    key: 'worshipForm',
    label: 'Form Worship Night',
    description: 'Menu form anonim di dashboard peserta',
  },
]

export default function FeatureFlagsClient({ initial }: { initial: YcParticipantFeatureFlags }) {
  const [flags, setFlags] = useState(initial)
  const [loadingKey, setLoadingKey] = useState<keyof YcParticipantFeatureFlags | null>(null)
  const [alert, setAlert] = useState<string | null>(null)

  async function toggle(key: keyof YcParticipantFeatureFlags) {
    const next = { ...flags, [key]: !flags[key] }
    setLoadingKey(key)
    try {
      await updateFeatureFlags(next)
      setFlags(next)
      setAlert('Pengaturan tersimpan')
    } catch {
      setAlert('Gagal menyimpan')
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <FormShell title="Fitur Peserta" back="/yc/admin">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
        Semua fitur nonaktif saat camp dimulai. Aktifkan saat panitia siap membuka masing-masing sesi.
      </p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {FEATURES.map((f, i) => (
          <div
            key={f.key}
            className="toggle-row"
            style={i < FEATURES.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
          >
            <div>
              <div className="toggle-label">{f.label}</div>
              <div className="toggle-sub">{f.description}</div>
            </div>
            <button
              type="button"
              className={`toggle ${flags[f.key] ? 'on' : 'off'}`}
              disabled={loadingKey === f.key}
              aria-pressed={flags[f.key]}
              aria-label={f.label}
              onClick={() => toggle(f.key)}
            />
          </div>
        ))}
      </div>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
