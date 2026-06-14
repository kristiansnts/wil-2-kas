'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import EmergencySoundToggle from '@/components/yc/participant/EmergencySoundToggle'
import ScanConfirmPanel from '@/components/yc/participant/ScanConfirmPanel'
import QrScanner from '@/components/yc/participant/QrScanner'

type Challenge = {
  slug: string
  title: string
  description: string | null
  points: number
  teamStatus: string | null
  fragmentsRecovered?: number
  fragmentsTotal?: number
}

function isExploring(status: string | null) {
  return !status || status === 'EXPLORING'
}

export default function TeamChallengeClient({
  token,
  challenge,
  showEmergencyAlarm = false,
}: {
  token: string
  challenge: Challenge
  showEmergencyAlarm?: boolean
}) {
  const [teamStatus, setTeamStatus] = useState(challenge.teamStatus)
  const [fragmentsRecovered] = useState(challenge.fragmentsRecovered ?? 0)
  const fragmentsTotal = challenge.fragmentsTotal ?? 8
  const [scanKey, setScanKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)
  const [pendingScan, setPendingScan] = useState<{ qrCode: string; fragmentOrder: number } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${challenge.slug}/emergency/status`)
      if (!res.ok) return
      const data = await res.json()
      setTeamStatus(data.status)
    } catch {
      /* ignore */
    }
  }, [token, challenge.slug])

  useEffect(() => {
    if (!isExploring(teamStatus)) return
    fetchStatus()
    const id = setInterval(fetchStatus, 3000)
    return () => clearInterval(id)
  }, [teamStatus, fetchStatus])

  async function handleQrScan(text: string) {
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${challenge.slug}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'QR tidak valid')
        setScanKey(k => k + 1)
        return
      }
      setPendingScan({ qrCode: data.qrCode, fragmentOrder: data.fragmentOrder })
    } catch {
      setAlert('Gagal memproses QR')
      setScanKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  const exploring = isExploring(teamStatus)
  const emergencyActive = !exploring && teamStatus !== 'COMPLETED'
  const completed = teamStatus === 'COMPLETED'

  return (
    <FormShell title={challenge.title} sub={`${challenge.points} poin`} back={`/yc/p/${token}/challenge`}>
      {challenge.description && (
        <div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.5 }}>
          {challenge.description}
        </div>
      )}

      {showEmergencyAlarm && <EmergencySoundToggle />}

      <div className="stat-pill">
        <div className="stat-pill-label">Memory Fragment</div>
        <div className="stat-pill-val">{fragmentsRecovered}/{fragmentsTotal}</div>
      </div>
      <div className="stat-pill">
        <div className="stat-pill-label">Status Team</div>
        <div className="stat-pill-val">{teamStatus ?? 'EXPLORING'}</div>
      </div>

      {exploring && !pendingScan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Cari QR Fragment</div>
            <p className="yc-progress-hint" style={{ marginBottom: 12 }}>
              Arahkan kamera ke QR code di area explore. Setelah ditemukan, konfirmasi Emergency Meeting.
            </p>
            <QrScanner
              key={scanKey}
              onScan={handleQrScan}
              onError={msg => setAlert(msg)}
            />
          </div>
          {loading && <div className="yc-progress-hint">Memverifikasi QR…</div>}
        </div>
      )}

      {pendingScan && (
        <ScanConfirmPanel
          token={token}
          slug={challenge.slug}
          qrCode={pendingScan.qrCode}
          fragmentOrder={pendingScan.fragmentOrder}
          onCancel={() => {
            setPendingScan(null)
            setScanKey(k => k + 1)
          }}
        />
      )}

      {emergencyActive && (
        <Link
          href={`/yc/p/${token}/challenge/${challenge.slug}/emergency`}
          className="submit-btn"
          style={{ textAlign: 'center', display: 'block' }}
        >
          Emergency Meeting
        </Link>
      )}

      {completed && (
        <div className="empty">
          <div className="empty-icon">🧩</div>
          <div className="empty-text">Memory Fragment Recovered!</div>
          <div className="empty-sub">Challenge kelompok selesai.</div>
        </div>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
