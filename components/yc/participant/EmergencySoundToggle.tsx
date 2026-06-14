'use client'

import { useEffect, useState } from 'react'
import {
  isEmergencySoundEnabled,
  setEmergencySoundEnabled,
  testEmergencySound,
} from '@/lib/yc/emergency-sound'
import { AlertModal } from '@/components/ui/AlertModal'

export default function EmergencySoundToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  useEffect(() => {
    setEnabled(isEmergencySoundEnabled())
  }, [])

  async function enable() {
    setLoading(true)
    const ok = await testEmergencySound()
    setLoading(false)
    if (!ok) {
      setAlert(
        'Gagal memuat atau memutar suara alarm. Pastikan koneksi internet stabil, volume perangkat aktif (bukan mode senyap), lalu coba lagi.',
      )
      return
    }
    setEmergencySoundEnabled(true)
    setEnabled(true)
    setAlert('Alarm emergency aktif. Kamu akan mendengar suara saat ada Emergency Meeting.')
  }

  if (enabled) {
    return (
      <div className="yc-sound-enabled">
        <span>🔔 Alarm emergency aktif</span>
      </div>
    )
  }

  return (
    <>
      <button type="button" className="submit-btn yc-sound-btn" disabled={loading} onClick={enable}>
        {loading ? 'Mengaktifkan...' : 'Aktifkan Alarm Emergency'}
      </button>
      <p className="yc-sound-hint">Wajib diaktifkan sebelum explore — panitia akan instruksikan saat briefing.</p>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </>
  )
}
