'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { createMeeting, closeMeeting } from '@/lib/actions/meeting'
import { AlertModal } from '@/components/ui/AlertModal'
import type { MeetingItem } from '@/lib/types'

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
}

function fmtDeadline(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function CreateSheet({ onClose, onSave, isPending }: {
  onClose: () => void
  onSave: (month: string, deadline: string) => void
  isPending: boolean
}) {
  const [month, setMonth] = useState('')
  const [deadline, setDeadline] = useState('')
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending || !month || !deadline) return
    submittingRef.current = true
    onSave(month, deadline)
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Buat Pertemuan Baru</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Bulan</label>
            <input
              className="form-input"
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Batas Pengisian</label>
            <input
              className="form-input"
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Buat Pertemuan'}
          </button>
        </form>
      </div>
    </div>
  )
}

interface Props { meetings: MeetingItem[] }

export default function PertemuanClient({ meetings }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate(month: string, deadline: string) {
    startTransition(async () => {
      await createMeeting({ month, deadline })
      setShowCreate(false)
    })
  }

  function handleClose(id: string) {
    startTransition(async () => {
      await closeMeeting(id)
    })
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/meeting/${token}`
    navigator.clipboard.writeText(url).then(() => setAlertMsg('Link berhasil disalin!'))
  }

  return (
    <div className="screen">
      <div className="topnav">
        <Link href="/" className="back-btn">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topnav-title">Pertemuan Wilayah</div>
          <div className="topnav-sub">{meetings.length} pertemuan</div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontWeight: 600 }}
        >
          + Buat
        </button>
      </div>

      <div className="content">
        {meetings.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-text">Belum ada pertemuan terdaftar</div>
            </div>
          </div>
        ) : (
          <div className="card">
            {meetings.map(m => (
              <div key={m.id} className="div-row" style={{ cursor: 'default' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span className="div-name">{fmtMonth(m.month)}</span>
                    <span className={`badge ${m.status === 'open' ? 'meeting-open' : 'meeting-closed'}`}>
                      {m.status === 'open' ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>
                  <div className="div-balance">
                    Batas: {fmtDeadline(m.deadline)} · {m._count.submissions} pengisian
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {m.status === 'open' && (
                    <button
                      onClick={() => copyLink(m.token)}
                      title="Salin link"
                      style={{ width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </button>
                  )}
                  <Link
                    href={`/pertemuan/${m.id}`}
                    style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      {showCreate && (
        <CreateSheet onClose={() => setShowCreate(false)} onSave={handleCreate} isPending={isPending} />
      )}
      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}
