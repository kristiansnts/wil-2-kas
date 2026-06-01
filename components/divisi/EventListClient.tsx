'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { fmtShort, fmtDate, todayStr } from '@/lib/format'
import { addEvent, updateEvent, deleteEvent } from '@/lib/actions/divisi'
import { DateInput } from '@/components/ui/DateInput'
import type { EventItem } from '@/lib/types'

interface TxnMin { eventId: string | null; type: 'masuk' | 'keluar'; amount: number }

interface Props {
  divisionId: string
  divisionName: string
  readOnly: boolean
  events: EventItem[]
  transactions: TxnMin[]
}

const btnIcon: React.CSSProperties = {
  width: 34, height: 34, border: 'none', borderRadius: 10,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

function PencilIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function EventCard({ ev, divisionId, spent, isPending, readOnly, onEdit, onDelete }: {
  ev: EventItem; divisionId: string; spent: number; isPending: boolean; readOnly: boolean
  onEdit: () => void; onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="event-card">
      <div className="event-dot" />
      <div style={{ flex: 1 }}>
        <div className="event-name">{ev.name}</div>
        <div className="event-date">{fmtDate(ev.date)}</div>
      </div>
      {!readOnly && (
        confirm ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => { setConfirm(false); onDelete() }} disabled={isPending}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Hapus</button>
            <button onClick={() => setConfirm(false)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>Batal</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{fmtShort(spent)} terpakai</div>
            <Link href={`/divisi/${divisionId}/event/${ev.id}/edit`} onClick={e => { e.preventDefault(); onEdit() }} style={{ ...btnIcon, background: 'var(--accent)', color: 'white', textDecoration: 'none' }}>
              <PencilIcon />
            </Link>
            <Link href={`/divisi/${divisionId}/event/${ev.id}/hapus`} onClick={e => { e.preventDefault(); setConfirm(true) }} style={{ ...btnIcon, background: 'var(--red)', color: 'white', textDecoration: 'none' }}>
              <TrashIcon />
            </Link>
          </div>
        )
      )}
      {readOnly && (
        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{fmtShort(spent)} terpakai</div>
      )}
    </div>
  )
}

function FormEventSheet({ onClose, onSave, isPending }: {
  onClose: () => void
  onSave: (payload: { name: string; date: string }) => void
  isPending: boolean
}) {
  const [nama, setNama] = useState('')
  const [tanggal, setTanggal] = useState(todayStr())
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    if (!nama) return
    submittingRef.current = true
    onSave({ name: nama, date: tanggal })
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Buat Event Baru</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nama Event</label>
            <input className="form-input" type="text" placeholder="cth. Festival Budaya 2026" value={nama} onChange={e => setNama(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Event</label>
            <DateInput className="form-input" value={tanggal} onChange={setTanggal} required />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Membuat...' : 'Buat Event'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormEditEventSheet({ ev, onClose, onSave, isPending }: {
  ev: EventItem
  onClose: () => void
  onSave: (name: string, date: string) => void
  isPending: boolean
}) {
  const [nama, setNama] = useState(ev.name)
  const [tanggal, setTanggal] = useState(ev.date.slice(0, 10))
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    if (!nama) return
    submittingRef.current = true
    onSave(nama, tanggal)
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Edit Event</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nama Event</label>
            <input className="form-input" type="text" value={nama} onChange={e => setNama(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Event</label>
            <DateInput className="form-input" value={tanggal} onChange={setTanggal} required />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function EventListClient({ divisionId, divisionName, readOnly, events, transactions }: Props) {
  const [showSheet, setShowSheet] = useState(false)
  const [editEvent, setEditEvent] = useState<EventItem | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSaveEvent(payload: { name: string; date: string }) {
    startTransition(async () => {
      await addEvent({ divisionId, ...payload })
      setShowSheet(false)
    })
  }

  function handleUpdateEvent(name: string, date: string) {
    if (!editEvent) return
    startTransition(async () => {
      await updateEvent(editEvent.id, divisionId, name, date)
      setEditEvent(null)
    })
  }

  function handleDeleteEvent(ev: EventItem) {
    startTransition(async () => {
      await deleteEvent(ev.id, divisionId)
    })
  }

  return (
    <div className="screen">
      <div className="topnav">
        <Link href={`/divisi/${divisionId}`} className="back-btn">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topnav-title">Semua Event</div>
          <div className="topnav-sub">{divisionName} · {events.length} event</div>
        </div>
        {!readOnly && (
          <Link
            href={`/divisi/${divisionId}/event/baru`}
            onClick={e => { e.preventDefault(); setShowSheet(true) }}
            style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', padding: '6px 8px', fontWeight: 600 }}
          >
            + Buat
          </Link>
        )}
      </div>

      <div className="content">
        {events.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">📅</div>
              <div className="empty-text">Belum ada event</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(ev => {
              const spent = transactions
                .filter(t => t.eventId === ev.id && t.type === 'keluar')
                .reduce((s, t) => s + t.amount, 0)
              return (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  divisionId={divisionId}
                  spent={spent}
                  isPending={isPending}
                  readOnly={readOnly}
                  onEdit={() => setEditEvent(ev)}
                  onDelete={() => handleDeleteEvent(ev)}
                />
              )
            })}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      {showSheet && (
        <FormEventSheet onClose={() => setShowSheet(false)} onSave={handleSaveEvent} isPending={isPending} />
      )}
      {editEvent && (
        <FormEditEventSheet ev={editEvent} onClose={() => setEditEvent(null)} onSave={handleUpdateEvent} isPending={isPending} />
      )}
    </div>
  )
}
