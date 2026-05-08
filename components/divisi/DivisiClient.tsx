'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import Link from 'next/link'
import { fmt, fmtShort, fmtDate, todayStr } from '@/lib/format'
import { addTxnDivisi, addEvent, deleteTxnDivisi, updateTxnDivisi, updateEvent, deleteEvent } from '@/lib/actions/divisi'
import { logout } from '@/lib/actions/auth'
import type { DivisionData, TxnDivisiItem, EventItem } from '@/lib/types'

interface Props {
  division: DivisionData
  readOnly?: boolean
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    back: <polyline points="15 18 9 12 15 6" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></>,
    pencil: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    log:    <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function ExcelIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  )
}

const btnIcon: React.CSSProperties = {
  width: 34, height: 34, border: 'none', borderRadius: 10,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

function TxnRow({ txn, eventName, onEdit, onDelete, isPending }: { txn: TxnDivisiItem; eventName?: string; onEdit: () => void; onDelete: () => void; isPending: boolean }) {
  const [confirm, setConfirm] = useState(false)
  const isTransferFromUmum = txn.desc === 'Transfer dari Kas Umum'
  return (
    <div className="txn-row">
      <div className={`txn-icon ${txn.type}`}>{txn.type === 'masuk' ? '↑' : '↓'}</div>
      <div className="txn-info">
        <div className="txn-desc">{txn.desc}</div>
        <div className="txn-meta">
          <span className="txn-meta-date">{fmtDate(txn.date)}</span>
          {txn.kategori && <span className={`badge ${txn.kategori}`}>{txn.kategori}</span>}
          {eventName && <span className="badge event" title={eventName}>{eventName}</span>}
          {isTransferFromUmum && <span className="badge transfer">dari kas umum</span>}
        </div>
      </div>
      {isTransferFromUmum ? (
        <div className={`txn-amount ${txn.type}`}>
          {txn.type === 'masuk' ? '+' : '-'}{fmtShort(txn.amount)}
        </div>
      ) : confirm ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => { setConfirm(false); onDelete() }}
            disabled={isPending}
            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
          >Hapus</button>
          <button
            onClick={() => setConfirm(false)}
            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
          >Batal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div className={`txn-amount ${txn.type}`}>
            {txn.type === 'masuk' ? '+' : '-'}{fmtShort(txn.amount)}
          </div>
          <button onClick={onEdit} disabled={isPending} style={{ ...btnIcon, background: 'var(--accent)', color: 'white' }}>
            <Icon name="pencil" size={15} />
          </button>
          <button onClick={() => setConfirm(true)} disabled={isPending} style={{ ...btnIcon, background: 'var(--red)', color: 'white' }}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function FormEditTxnDivisiSheet({ txn, events, onClose, onSave, isPending }: {
  txn: TxnDivisiItem
  events: EventItem[]
  onClose: () => void
  onSave: (payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string; kategori: 'harian' | 'event'; eventId?: string }) => void
  isPending: boolean
}) {
  const [tipe, setTipe] = useState(txn.type)
  const [kategori, setKategori] = useState<'harian' | 'event'>(txn.kategori ?? 'harian')
  const [eventId, setEventId] = useState(txn.eventId ?? events[0]?.id ?? '')
  const [jumlah, setJumlah] = useState(String(txn.amount))
  const [keterangan, setKeterangan] = useState(txn.desc)
  const [tanggal, setTanggal] = useState(txn.date.slice(0, 10))
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    const amount = parseInt(jumlah) || 0
    if (!amount || !keterangan) return
    submittingRef.current = true
    onSave({ type: tipe, amount, desc: keterangan, date: tanggal, kategori, eventId: kategori === 'event' ? eventId : undefined })
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Edit Transaksi</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Tipe</label>
            <div className="seg-control">
              <button type="button" className={`seg-btn ${tipe === 'masuk' ? 'active masuk' : ''}`} onClick={() => setTipe('masuk')}>↑ Pemasukan</button>
              <button type="button" className={`seg-btn ${tipe === 'keluar' ? 'active keluar' : ''}`} onClick={() => setTipe('keluar')}>↓ Pengeluaran</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="seg-control">
              <button type="button" className={`seg-btn ${kategori === 'harian' ? 'active' : ''}`} onClick={() => setKategori('harian')}>Harian</button>
              <button type="button" className={`seg-btn ${kategori === 'event' ? 'active' : ''}`} onClick={() => setKategori('event')}>Event</button>
            </div>
          </div>
          {kategori === 'event' && (
            <div className="form-group">
              <label className="form-label">Event</label>
              {events.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>Belum ada event.</div>
              ) : (
                <select className="form-select" value={eventId} onChange={e => setEventId(e.target.value)}>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              )}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Jumlah (Rp)</label>
            <input className="form-input" type="number" inputMode="numeric" value={jumlah} onChange={e => setJumlah(e.target.value)} required min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input className="form-input" type="text" value={keterangan} onChange={e => setKeterangan(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input className="form-input" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormTxnDivisiSheet({
  tipeInit,
  events,
  divisionId,
  onClose,
  onSave,
  isPending,
}: {
  tipeInit: 'masuk' | 'keluar'
  events: EventItem[]
  divisionId: string
  onClose: () => void
  onSave: (payload: Parameters<typeof addTxnDivisi>[0]) => void
  isPending: boolean
}) {
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>(tipeInit)
  const [kategori, setKategori] = useState<'harian' | 'event'>('harian')
  const [eventId, setEventId] = useState(events[0]?.id ?? '')
  const [jumlah, setJumlah] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [tanggal, setTanggal] = useState(todayStr())
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    const amount = parseInt(jumlah) || 0
    if (!amount || !keterangan) return
    submittingRef.current = true
    onSave({ divisionId, type: tipe, kategori, eventId: kategori === 'event' ? eventId : undefined, amount, desc: keterangan, date: tanggal })
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{tipe === 'masuk' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Tipe</label>
            <div className="seg-control">
              <button type="button" className={`seg-btn ${tipe === 'masuk' ? 'active masuk' : ''}`} onClick={() => setTipe('masuk')}>↑ Pemasukan</button>
              <button type="button" className={`seg-btn ${tipe === 'keluar' ? 'active keluar' : ''}`} onClick={() => setTipe('keluar')}>↓ Pengeluaran</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="seg-control">
              <button type="button" className={`seg-btn ${kategori === 'harian' ? 'active' : ''}`} onClick={() => setKategori('harian')}>Harian</button>
              <button type="button" className={`seg-btn ${kategori === 'event' ? 'active' : ''}`} onClick={() => setKategori('event')}>Event</button>
            </div>
          </div>

          {kategori === 'event' && (
            <div className="form-group">
              <label className="form-label">Event</label>
              {events.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>Belum ada event. Buat event terlebih dahulu.</div>
              ) : (
                <select className="form-select" value={eventId} onChange={e => setEventId(e.target.value)}>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Jumlah (Rp)</label>
            <input className="form-input" type="number" inputMode="numeric" placeholder="0" value={jumlah} onChange={e => setJumlah(e.target.value)} required min="1" />
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input className="form-input" type="text" placeholder="Deskripsi transaksi..." value={keterangan} onChange={e => setKeterangan(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input className="form-input" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
          </div>

          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormEventSheet({
  onClose,
  onSave,
  isPending,
}: {
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
            <input className="form-input" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Membuat...' : 'Buat Event'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EventCard({ ev, spent, isPending, readOnly, onSelect, onEdit, onDelete }: {
  ev: EventItem; spent: number; isPending: boolean; readOnly: boolean
  onSelect: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="event-card" onClick={onSelect}>
      <div className="event-dot" />
      <div style={{ flex: 1 }}>
        <div className="event-name">{ev.name}</div>
        <div className="event-date">{fmtDate(ev.date)}</div>
      </div>
      {!readOnly && (
        confirm ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setConfirm(false); onDelete() }} disabled={isPending}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Hapus</button>
            <button onClick={() => setConfirm(false)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>Batal</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{fmtShort(spent)} terpakai</div>
            <button onClick={onEdit} disabled={isPending} style={{ ...btnIcon, background: 'var(--accent)', color: 'white' }}>
              <Icon name="pencil" size={15} />
            </button>
            <button onClick={() => setConfirm(true)} disabled={isPending} style={{ ...btnIcon, background: 'var(--red)', color: 'white' }}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        )
      )}
      {readOnly && (
        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{fmtShort(spent)} terpakai</div>
      )}
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
            <input className="form-input" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}

type SheetState = null | 'masuk' | 'keluar' | 'event'
type TabState = 'semua' | 'harian' | 'event'

export default function DivisiClient({ division, readOnly = false }: Props) {
  const [sheet, setSheet] = useState<SheetState>(null)
  const [editTxn, setEditTxn] = useState<TxnDivisiItem | null>(null)
  const [editEvent, setEditEvent] = useState<EventItem | null>(null)
  const [tab, setTab] = useState<TabState>('semua')
  const [selectedEventId, setSelectedEventId] = useState(division.events[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()

  const today = todayStr()
  const txns = division.transactions
  const events = division.events

  const filteredTxns = useMemo(() => {
    if (tab === 'harian') return txns.filter(t => t.kategori === 'harian')
    if (tab === 'event') return txns.filter(t => t.kategori === 'event' && t.eventId === selectedEventId)
    return txns
  }, [tab, txns, selectedEventId])

  const totalMasuk = txns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
  const totalKeluar = txns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)

  function handleSaveTxn(payload: Parameters<typeof addTxnDivisi>[0]) {
    startTransition(async () => {
      await addTxnDivisi(payload)
      setSheet(null)
    })
  }

  function handleSaveEvent(payload: { name: string; date: string }) {
    startTransition(async () => {
      await addEvent({ divisionId: division.id, ...payload })
      setSheet(null)
    })
  }

  function handleUpdateEvent(name: string, date: string) {
    if (!editEvent) return
    startTransition(async () => {
      await updateEvent(editEvent.id, division.id, name, date)
      setEditEvent(null)
    })
  }

  function handleDeleteEvent(ev: EventItem) {
    startTransition(async () => {
      await deleteEvent(ev.id, division.id)
    })
  }

  function handleDeleteTxn(txn: TxnDivisiItem) {
    startTransition(async () => {
      await deleteTxnDivisi(txn.id, division.id, txn.amount, txn.type)
    })
  }

  function handleUpdateTxn(payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string; kategori: 'harian' | 'event'; eventId?: string }) {
    if (!editTxn) return
    startTransition(async () => {
      await updateTxnDivisi(editTxn.id, division.id, editTxn.amount, editTxn.type, payload)
      setEditTxn(null)
    })
  }

  function getEventName(eventId: string | null): string | undefined {
    if (!eventId) return undefined
    return events.find(e => e.id === eventId)?.name
  }

  return (
    <div className="screen">
      <div className="topnav">
        {readOnly && (
          <Link href="/" className="back-btn">
            <Icon name="back" size={18} />
          </Link>
        )}
        <div style={{ flex: 1 }}>
          <div className="topnav-title">{division.name}</div>
          <div className="topnav-sub">{readOnly ? 'Hanya Lihat' : 'Kas Komisi'} · Per {fmtDate(today)}</div>
        </div>
        <Link href="/log" style={{
          fontSize: 13, color: 'var(--muted)', padding: '6px 8px',
        }}>Log</Link>
        <form action={logout}>
          <button type="submit" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--muted)', padding: '6px 8px',
          }}>Keluar</button>
        </form>
      </div>

      <div className="content">
        <div className="balance-card">
          <Link
            href="/laporan"
            title="Laporan Keuangan"
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 1,
              background: 'rgba(255,255,255,0.15)', borderRadius: 8,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}
          >
            <ExcelIcon />
          </Link>
          <div className="balance-label">Saldo Divisi {division.name}</div>
          <div className="balance-amount">{fmt(division.balance)}</div>
          <div className="balance-date">Per {fmtDate(today)}</div>
        </div>

        <div className="stats-row">
          <div className="stat-pill">
            <div className="stat-pill-label">Pemasukan</div>
            <div className="stat-pill-val green">{fmtShort(totalMasuk)}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-pill-label">Pengeluaran</div>
            <div className="stat-pill-val red">{fmtShort(totalKeluar)}</div>
          </div>
        </div>

        {!readOnly && (
          <div className="actions-grid">
            <button className="action-btn" onClick={() => setSheet('masuk')}>
              <div className="action-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><Icon name="plus" size={18} /></div>
              <div className="action-label">Catat Pemasukan</div>
            </button>
            <button className="action-btn" onClick={() => setSheet('keluar')}>
              <div className="action-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}><Icon name="minus" size={18} /></div>
              <div className="action-label">Catat Pengeluaran</div>
            </button>
            <button className="action-btn wide" onClick={() => setSheet('event')}>
              <div className="action-icon" style={{ background: 'oklch(0.93 0.06 310)', color: 'oklch(0.42 0.16 310)' }}><Icon name="flag" size={17} /></div>
              <div className="action-label">Buat Event Baru</div>
            </button>
          </div>
        )}

        {events.length > 0 && (
          <div>
            <div className="section-title" style={{ marginBottom: 10 }}>Event Aktif</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map(ev => {
                const spent = txns.filter(t => t.eventId === ev.id && t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
                return (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    spent={spent}
                    isPending={isPending}
                    readOnly={readOnly}
                    onSelect={() => { setSelectedEventId(ev.id); setTab('event') }}
                    onEdit={() => setEditEvent(ev)}
                    onDelete={() => handleDeleteEvent(ev)}
                  />
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="section-title" style={{ marginBottom: 10 }}>Riwayat Transaksi</div>
          <div className="tabs" style={{ marginBottom: 10 }}>
            <button className={`tab-btn ${tab === 'semua' ? 'active' : ''}`} onClick={() => setTab('semua')}>Semua</button>
            <button className={`tab-btn ${tab === 'harian' ? 'active' : ''}`} onClick={() => setTab('harian')}>Harian</button>
            <button className={`tab-btn ${tab === 'event' ? 'active' : ''}`} onClick={() => setTab('event')}>Event</button>
          </div>

          {tab === 'event' && events.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {fmtDate(ev.date)}</option>)}
              </select>
            </div>
          )}

          <div className="card">
            {filteredTxns.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div className="empty-text">Belum ada transaksi</div>
              </div>
            ) : (
              filteredTxns.map(txn => (
                <TxnRow key={txn.id} txn={txn} eventName={getEventName(txn.eventId)} onEdit={() => setEditTxn(txn)} onDelete={() => handleDeleteTxn(txn)} isPending={isPending} />
              ))
            )}
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      {sheet === 'masuk' && (
        <FormTxnDivisiSheet tipeInit="masuk" events={events} divisionId={division.id} onClose={() => setSheet(null)} onSave={handleSaveTxn} isPending={isPending} />
      )}
      {sheet === 'keluar' && (
        <FormTxnDivisiSheet tipeInit="keluar" events={events} divisionId={division.id} onClose={() => setSheet(null)} onSave={handleSaveTxn} isPending={isPending} />
      )}
      {sheet === 'event' && (
        <FormEventSheet onClose={() => setSheet(null)} onSave={handleSaveEvent} isPending={isPending} />
      )}
      {editTxn && (
        <FormEditTxnDivisiSheet txn={editTxn} events={events} onClose={() => setEditTxn(null)} onSave={handleUpdateTxn} isPending={isPending} />
      )}
      {editEvent && (
        <FormEditEventSheet ev={editEvent} onClose={() => setEditEvent(null)} onSave={handleUpdateEvent} isPending={isPending} />
      )}
    </div>
  )
}
