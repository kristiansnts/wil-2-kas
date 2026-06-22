'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import QrScanner from '@/components/yc/participant/QrScanner'
import {
  YC_NAMETAG_MIN_CHARS,
  YC_SIPALING_EXTROVERT_SLUG,
} from '@/lib/yc/constants'
import { pointsFromCharCount } from '@/lib/yc/nametag-scoring'
import type { NametagPairingView } from '@/lib/yc/types'

type Challenge = {
  slug: string
  title: string
  description: string | null
  points: number
}

type Status = {
  openPairing: NametagPairingView | null
  pairingCount: number
  totalPointsEarned: number
}

const STORY_PLACEHOLDER =
  'Ceritakan siapa dia dan apa yang kamu pelajari setelah ngobrol dengannya. Boleh cerita tentang hobi, impian, pelayanan, hal unik, atau cerita hidup yang dia bagikan. (Minimal 50 karakter).'

const RULES = [
  'Cari peserta yang belum pernah kamu ajak ngobrol.',
  'Scan QR di name tag mereka.',
  'Ngobrol bebas minimal 5 menit.',
  'Setelah selesai, kedua peserta mengisi cerita singkat tentang lawan bicara.',
  'Satu pasangan hanya bisa diselesaikan 1 kali selama event.',
]

export default function ExtrovertChallengeClient({
  token,
  challenge,
  initialStatus,
}: {
  token: string
  challenge: Challenge
  initialStatus: Status
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [showScanner, setShowScanner] = useState(false)
  const [scanKey, setScanKey] = useState(0)
  const [storyText, setStoryText] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  const pairing = status.openPairing
  const charCount = storyText.trim().length
  const previewPoints = pointsFromCharCount(charCount)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${YC_SIPALING_EXTROVERT_SLUG}/nametag/status`)
      if (!res.ok) return
      const data = await res.json()
      setStatus({
        openPairing: data.openPairing ?? null,
        pairingCount: data.pairingCount ?? 0,
        totalPointsEarned: data.totalPointsEarned ?? 0,
      })
      if (data.openPairing?.myStoryText) {
        setStoryText(data.openPairing.myStoryText)
      }
    } catch {
      /* ignore */
    }
  }, [token])

  useEffect(() => {
    if (!pairing || pairing.status === 'COMPLETED') return
    fetchStatus()
    const id = setInterval(fetchStatus, 3000)
    return () => clearInterval(id)
  }, [pairing?.id, pairing?.status, fetchStatus])

  async function handleScan(text: string) {
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${YC_SIPALING_EXTROVERT_SLUG}/nametag/scan`, {
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
      setShowScanner(false)
      setStatus(prev => ({ ...prev, openPairing: data.pairing }))
      setStoryText('')
    } catch {
      setAlert('Gagal memproses QR')
      setScanKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  async function submitStory() {
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${YC_SIPALING_EXTROVERT_SLUG}/nametag/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal mengirim cerita')
        return
      }
      setStatus(prev => ({ ...prev, openPairing: data.pairing }))
      if (data.waitingForPartner) {
        setAlert('Cerita terkirim! Menunggu pasanganmu juga mengisi cerita.')
      } else if (data.pointsAwarded != null) {
        setAlert('Cerita selesai! Terima kasih sudah berbagi.')
        router.refresh()
      }
    } catch {
      setAlert('Gagal mengirim cerita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormShell title={challenge.title} sub="Cerita di Balik Name Tag" back={`/yc/p/${token}/challenge`}>
      <div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.55 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>🫂 Challenge: Cerita di Balik Name Tag</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {RULES.map(rule => (
            <li key={rule} style={{ marginBottom: 4 }}>{rule}</li>
          ))}
        </ul>
      </div>

      <div className="stat-pill">
        <div className="stat-pill-label">Pasangan Selesai</div>
        <div className="stat-pill-val">{status.pairingCount}</div>
      </div>

      {!pairing && !showScanner && (
        <button className="submit-btn" onClick={() => setShowScanner(true)}>
          Scan Name Tag Teman
        </button>
      )}

      {showScanner && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Scan QR Name Tag</div>
          <p className="yc-progress-hint" style={{ marginBottom: 12 }}>
            Arahkan kamera ke QR code di name tag peserta. Pasanganmu akan otomatis diarahkan ke halaman ini.
          </p>
          <QrScanner key={scanKey} onScan={handleScan} onError={msg => setAlert(msg)} />
          <button
            className="btn-secondary"
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => {
              setShowScanner(false)
              setScanKey(k => k + 1)
            }}
          >
            Batal
          </button>
          {loading && <div className="yc-progress-hint" style={{ marginTop: 8 }}>Memverifikasi QR…</div>}
        </div>
      )}

      {pairing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="stat-pill-label">Sedang ngobrol dengan</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {pairing.partner.name ?? 'Peserta'}
            </div>
            {pairing.partner.churchName && (
              <div className="yc-progress-hint">{pairing.partner.churchName}</div>
            )}
          </div>

          {pairing.status === 'COMPLETED' ? (
            <div className="empty">
              <div className="empty-icon">🫂</div>
              <div className="empty-text">Ngobrol selesai!</div>
              <div className="empty-sub">
                Kamu +{pairing.myPointsAwarded ?? 0} poin
                {pairing.partnerStorySubmitted ? ` · Pasangan +${pairing.partnerPointsAwarded ?? 0} poin` : ''}
              </div>
              <button className="submit-btn" style={{ marginTop: 16 }} onClick={() => {
                setStatus(prev => ({ ...prev, openPairing: null }))
                setStoryText('')
                setShowScanner(true)
                setScanKey(k => k + 1)
              }}>
                Scan Name Tag Lain
              </button>
            </div>
          ) : pairing.myStorySubmitted ? (
            <div className="card" style={{ padding: 16 }}>
              <div className="yc-progress-hint--ok" style={{ fontSize: 14, marginBottom: 8 }}>
                Ceritamu sudah terkirim ({pairing.myCharCount} karakter)
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                {pairing.myStoryText}
              </p>
              {!pairing.partnerStorySubmitted && (
                <p className="yc-progress-hint" style={{ marginTop: 12, marginBottom: 0 }}>
                  Menunggu {pairing.partner.name ?? 'pasanganmu'} mengisi cerita…
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Cerita tentang {pairing.partner.name ?? 'pasanganmu'}</label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  placeholder={STORY_PLACEHOLDER}
                />
                <div className="yc-progress-hint" style={{ marginTop: 6 }}>
                  {charCount} karakter
                  {charCount >= YC_NAMETAG_MIN_CHARS
                    ? ` · estimasi +${previewPoints} poin`
                    : ` · minimal ${YC_NAMETAG_MIN_CHARS} karakter`}
                </div>
              </div>
              <button
                className="submit-btn"
                disabled={loading || charCount < YC_NAMETAG_MIN_CHARS}
                onClick={submitStory}
              >
                {loading ? 'Mengirim...' : 'Kirim Cerita'}
              </button>
            </>
          )}
        </div>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
