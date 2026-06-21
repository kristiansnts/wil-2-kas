'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { YC_BRAND } from '@/lib/yc/constants'
import { OUTBOUND_POSITION_COUNT, outboundScheduleForPosition } from '@/lib/yc/outbound-data'
import { setOutboundPosition } from '@/lib/yc/actions/outbound'
import { ycLogout } from '@/lib/yc/actions/auth'
import { AlertModal } from '@/components/ui/AlertModal'

export default function OutboundPosSetupClient() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  const preview = selected ? outboundScheduleForPosition(selected) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) {
      setAlert('Pilih pos tugas kamu dulu')
      return
    }
    setLoading(true)
    try {
      const res = await setOutboundPosition(selected)
      if (res && 'error' in res) {
        setAlert(res.error!)
        return
      }
      router.refresh()
    } catch {
      setAlert('Gagal menyimpan pos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="topnav">
        <div style={{ flex: 1 }}>
          <div className="topnav-title">{YC_BRAND}</div>
          <div className="topnav-sub">Outbound Challenge</div>
        </div>
        <form action={ycLogout}>
          <button type="submit" className="yc-outbound-nav-btn yc-outbound-nav-btn--accent">
            Logout
          </button>
        </form>
      </div>

      <div className="content">
        <div className="section-header yc-outbound-section" style={{ marginTop: 0 }}>
          <div className="section-title">Pos Tugas Panitia</div>
        </div>
        <p className="yc-outbound-lead">
          Pilih pos yang kamu jaga. Dashboard hanya menampilkan game di pos tersebut.
        </p>

        <form onSubmit={handleSubmit} className="card yc-outbound-form-card">
          <div className="form-group">
            <label htmlFor="outbound-pos" className="form-label">
              Pos saya
            </label>
            <select
              id="outbound-pos"
              className="form-select"
              value={selected ?? ''}
              disabled={loading}
              onChange={e => setSelected(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Pilih pos 1–5 —</option>
              {Array.from({ length: OUTBOUND_POSITION_COUNT }, (_, i) => i + 1).map(pos => (
                <option key={pos} value={pos}>
                  Pos {pos}
                </option>
              ))}
            </select>
          </div>

          {preview.length > 0 && (
            <div className="yc-outbound-preview">
              <div className="yc-outbound-preview-title">Jadwal Pos {selected}</div>
              <div className="yc-admin-table-wrap" style={{ marginTop: 10 }}>
                <table className="yc-admin-table">
                  <thead>
                    <tr>
                      <th>Ronde</th>
                      <th>Pos {selected}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(row => (
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
            </div>
          )}

          <button type="submit" className="submit-btn yc-outbound-form-actions" disabled={loading}>
            {loading ? 'Memproses…' : 'Masuk Dashboard'}
          </button>
        </form>
      </div>

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </div>
  )
}
