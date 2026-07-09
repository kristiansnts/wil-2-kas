'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertModal } from '@/components/ui/AlertModal'
import {
  setLastSeenEmergencyAt,
  stopEmergencyAlarm,
} from '@/lib/yc/emergency-sound'
import { ycLogClient } from '@/lib/yc/log'

type Props = {
  token: string
  slug: string
  qrCode: string
  fragmentOrder: number
  onCancel?: () => void
}

export default function ScanConfirmPanel({
  token,
  slug,
  qrCode,
  fragmentOrder,
  onCancel,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  async function confirmEmergency() {
    setLoading(true)
    ycLogClient(token, 'treasure-hunt', 'emergency_trigger_begin', { slug, fragmentOrder, qrCode })
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${slug}/emergency/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        ycLogClient(token, 'treasure-hunt', 'emergency_trigger_failed', {
          status: res.status,
          error: data.error ?? null,
        })
        setAlert(data.error || 'Gagal memulai Emergency Meeting')
        return
      }

      ycLogClient(token, 'treasure-hunt', 'emergency_trigger_ok', {
        emergencyCalledAt: data.emergencyCalledAt ?? null,
      })

      if (data.emergencyCalledAt) {
        setLastSeenEmergencyAt(data.emergencyCalledAt)
      }
      stopEmergencyAlarm()
      router.push(`/yc/p/${token}/challenge/${slug}/emergency`)
    } catch (e) {
      ycLogClient(token, 'treasure-hunt', 'emergency_trigger_network_error', {
        message: e instanceof Error ? e.message : String(e),
      })
      setAlert('Gagal memulai Emergency Meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🧩</div>
        <div style={{ fontWeight: 700, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
          Memory Fragment Ditemukan!
        </div>
        <div className="yc-progress-hint" style={{ textAlign: 'center', marginBottom: 16 }}>
          Fragment {fragmentOrder} — panggil Emergency Meeting agar seluruh kelompok kumpul di Aula.
        </div>
        <button
          type="button"
          className="submit-btn"
          style={{ background: 'var(--red)', marginBottom: 8 }}
          disabled={loading}
          onClick={confirmEmergency}
        >
          {loading ? 'Memulai…' : 'Emergency Meeting'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="submit-btn yc-btn-done"
            disabled={loading}
            onClick={onCancel}
          >
            Batal
          </button>
        )}
      </div>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </>
  )
}
