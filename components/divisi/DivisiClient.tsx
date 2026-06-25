'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import Link from 'next/link'
import { fmt, fmtShort, fmtDate, todayStr } from '@/lib/format'
import { RupiahInput } from '@/components/ui/RupiahInput'
import { DateInput } from '@/components/ui/DateInput'
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

function TxnRow({ txn, divisionId, eventName, onEdit, onDelete, isPending, readOnly }: { txn: TxnDivisiItem; divisionId: string; eventName?: string; onEdit: () => void; onDelete: () => void; isPending: boolean; readOnly: boolean }) {
  const [confirm, setConfirm] = useState(false)
  const isTransferFromUmum = txn.desc === 'Transfer dari Kas Umum'
  return (
    <Link href={`/divisi/${divisionId}/transaksi/${txn.id}`} className="txn-row" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={`txn-icon ${txn.type}`}>{txn.type === 'masuk' ? '↑' : '↓'}</div>
      <div className="txn-info">
        <div className="txn-desc">
          {txn.desc}
          {txn.attachmentUrl && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 8,
              }}
            >
              📎 Lampiran
            </span>
          )}
        </div>
        <div className="txn-meta">
          <span className="txn-meta-date">{fmtDate(txn.date)}</span>
          {txn.kategori && <span className={`badge ${txn.kategori}`}>{txn.kategori}</span>}
          {eventName && <span className="badge event" title={eventName}>{eventName}</span>}
          {isTransferFromUmum && <span className="badge transfer">dari kas umum</span>}
        </div>
      </div>
      {isTransferFromUmum || readOnly ? (
        <div className={`txn-amount ${txn.type}`}>
          {txn.type === 'masuk' ? '+' : '-'}{fmtShort(txn.amount)}
        </div>
      ) : confirm ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={(e) => e.preventDefault()}>
          <button
            onClick={(e) => { e.preventDefault(); setConfirm(false); onDelete() }}
            disabled={isPending}
            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--red)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
          >Hapus</button>
          <button
            onClick={(e) => { e.preventDefault(); setConfirm(false) }}
            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
          >Batal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={(e) => e.preventDefault()}>
          <div className={`txn-amount ${txn.type}`}>
            {txn.type === 'masuk' ? '+' : '-'}{fmtShort(txn.amount)}
          </div>
          <button onClick={(e) => { e.preventDefault(); onEdit() }} style={{ ...btnIcon, background: 'var(--accent)', color: 'white', border: 'none' }}>
            <Icon name="pencil" size={15} />
          </button>
          <button onClick={(e) => { e.preventDefault(); setConfirm(true) }} style={{ ...btnIcon, background: 'var(--red)', color: 'white', border: 'none' }}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      )}
    </Link>
  )
}

function FormEditTxnDivisiSheet({ txn, events, onClose, onSave, isPending }: {
  txn: TxnDivisiItem
  events: EventItem[]
  onClose: () => void
  onSave: (payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string; kategori: 'harian' | 'event'; eventId?: string; attachmentUrl?: string; attachmentKey?: string }) => void
  isPending: boolean
}) {
  const [tipe, setTipe] = useState(txn.type)
  const [kategori, setKategori] = useState<'harian' | 'event'>(txn.kategori ?? 'harian')
  const [eventId, setEventId] = useState(txn.eventId ?? events[0]?.id ?? '')
  const [jumlah, setJumlah] = useState(String(txn.amount))
  const [keterangan, setKeterangan] = useState(txn.desc)
  const [tanggal, setTanggal] = useState(txn.date.slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const submittingRef = useRef(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending || uploading) return
    const amount = parseInt(jumlah) || 0
    if (!amount || !keterangan) return
    submittingRef.current = true

    let attachmentUrl = txn.attachmentUrl || ''
    let attachmentKey = txn.attachmentKey || ''

    if (file) {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload-transaction', {
          method: 'POST',
          body: formData,
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.error || 'Upload failed')
        attachmentUrl = result.url
        attachmentKey = result.key
      } catch (err) {
        alert('Gagal mengunggah file: ' + (err instanceof Error ? err.message : 'Unknown error'))
        submittingRef.current = false
        setUploading(false)
        return
      }
      setUploading(false)
    }

    onSave({ type: tipe, amount, desc: keterangan, date: tanggal, kategori, eventId: kategori === 'event' ? eventId : undefined, attachmentUrl, attachmentKey })
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
            <label className="form-label">Jumlah</label>
            <RupiahInput value={jumlah} onChange={setJumlah} required />
          </div>
          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input className="form-input" type="text" value={keterangan} onChange={e => setKeterangan(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <DateInput className="form-input" value={tanggal} onChange={setTanggal} required />
          </div>
          <div className="form-group">
            <label className="form-label">Lampiran (Opsional)</label>
            {txn.attachmentUrl && !file && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
                <a href={txn.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  📎 Lampiran saat ini
                </a>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {file && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>
          <button type="submit" className="submit-btn" disabled={isPending || uploading} style={{ marginTop: 4 }}>
            {uploading ? 'Mengunggah...' : isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
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
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const submittingRef = useRef(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending || uploading) return
    const amount = parseInt(jumlah) || 0
    if (!amount || !keterangan) return
    submittingRef.current = true

    let attachmentUrl = ''
    let attachmentKey = ''

    if (file) {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload-transaction', {
          method: 'POST',
          body: formData,
        })
        const result = await res.json()
        if (!result.success) throw new Error(result.error || 'Upload failed')
        attachmentUrl = result.url
        attachmentKey = result.key
      } catch (err) {
        alert('Gagal mengunggah file: ' + (err instanceof Error ? err.message : 'Unknown error'))
        submittingRef.current = false
        setUploading(false)
        return
      }
      setUploading(false)
    }

    onSave({ divisionId, type: tipe, kategori, eventId: kategori === 'event' ? eventId : undefined, amount, desc: keterangan, date: tanggal, attachmentUrl, attachmentKey })
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
            <label className="form-label">Jumlah</label>
            <RupiahInput value={jumlah} onChange={setJumlah} required />
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input className="form-input" type="text" placeholder="Deskripsi transaksi..." value={keterangan} onChange={e => setKeterangan(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <DateInput className="form-input" value={tanggal} onChange={setTanggal} required />
          </div>

          <div className="form-group">
            <label className="form-label">Lampiran (Opsional)</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {file && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={isPending || uploading || (kategori === 'event' && !eventId)} style={{ marginTop: 4 }}>
            {uploading ? 'Mengunggah...' : isPending ? 'Menyimpan...' : 'Simpan'}
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

function EventAmounts({ income, spent }: { income: number; spent: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{fmtShort(income)} masuk</div>
      <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{fmtShort(spent)} terpakai</div>
    </div>
  )
}

function EventCard({ ev, divisionId, income, spent, isPending, readOnly, onSelect, onEdit, onDelete }: {
  ev: EventItem; divisionId: string; income: number; spent: number; isPending: boolean; readOnly: boolean
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
            <EventAmounts income={income} spent={spent} />
            <Link href={`/divisi/${divisionId}/event/${ev.id}/edit`} onClick={e => { e.preventDefault(); onEdit() }} style={{ ...btnIcon, background: 'var(--accent)', color: 'white', textDecoration: 'none' }}>
              <Icon name="pencil" size={15} />
            </Link>
            <Link href={`/divisi/${divisionId}/event/${ev.id}/hapus`} onClick={e => { e.preventDefault(); setConfirm(true) }} style={{ ...btnIcon, background: 'var(--red)', color: 'white', textDecoration: 'none' }}>
              <Icon name="trash" size={15} />
            </Link>
          </div>
        )
      )}
      {readOnly && <EventAmounts income={income} spent={spent} />}
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

type SheetState = null | 'masuk' | 'keluar' | 'event'
type TabState = 'semua' | 'harian' | 'event'

export default function DivisiClient({ division, readOnly = false }: Props) {
  const [sheet, setSheet] = useState<SheetState>(null)
  const [editTxn, setEditTxn] = useState<TxnDivisiItem | null>(null)
  const [editEvent, setEditEvent] = useState<EventItem | null>(null)
  const [tab, setTab] = useState<TabState>('semua')
  const [selectedEventId, setSelectedEventId] = useState(division.events[0]?.id ?? '')
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()

  const today = todayStr()
  const txns = division.transactions
  const events = division.events

  const filteredTxns = useMemo(() => {
    if (tab === 'harian') return txns.filter(t => t.kategori === 'harian')
    if (tab === 'event') return txns.filter(t => t.kategori === 'event' && t.eventId === selectedEventId)
    return txns
  }, [tab, txns, selectedEventId])

  const PAGE_SIZE = 10
  const totalPages = Math.ceil(filteredTxns.length / PAGE_SIZE)
  const pagedTxns = filteredTxns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function changeTab(next: TabState) { setTab(next); setPage(0) }
  function changeEvent(id: string) { setSelectedEventId(id); setPage(0) }

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
      await deleteTxnDivisi(txn.id, division.id, txn.amount, txn.type, txn.attachmentKey)
    })
  }

  function handleUpdateTxn(payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string; kategori: 'harian' | 'event'; eventId?: string; attachmentUrl?: string; attachmentKey?: string }) {
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
          // Progressive enhancement: real links to no-JS fallback pages; JS intercepts to open the modal.
          <div className="actions-grid">
            <Link href={`/divisi/${division.id}/pemasukan`} className="action-btn" onClick={e => { e.preventDefault(); setSheet('masuk') }}>
              <div className="action-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><Icon name="plus" size={18} /></div>
              <div className="action-label">Catat Pemasukan</div>
            </Link>
            <Link href={`/divisi/${division.id}/pengeluaran`} className="action-btn" onClick={e => { e.preventDefault(); setSheet('keluar') }}>
              <div className="action-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}><Icon name="minus" size={18} /></div>
              <div className="action-label">Catat Pengeluaran</div>
            </Link>
            <Link href={`/divisi/${division.id}/event/baru`} className="action-btn wide" onClick={e => { e.preventDefault(); setSheet('event') }}>
              <div className="action-icon" style={{ background: '#f2e3ff', color: '#6b22a0' }}><Icon name="flag" size={17} /></div>
              <div className="action-label">Buat Event Baru</div>
            </Link>
          </div>
        )}

        {events.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="section-title">Event Aktif</div>
              {events.length > 3 && (
                <Link href={`/divisi/${division.id}/event`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                  Lihat Semua ({events.length})
                </Link>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.slice(0, 3).map(ev => {
                const eventTxns = txns.filter(t => t.eventId === ev.id)
                const income = eventTxns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
                const spent = eventTxns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
                return (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    divisionId={division.id}
                    income={income}
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
            <button className={`tab-btn ${tab === 'semua' ? 'active' : ''}`} onClick={() => changeTab('semua')}>Semua</button>
            <button className={`tab-btn ${tab === 'harian' ? 'active' : ''}`} onClick={() => changeTab('harian')}>Harian</button>
            <button className={`tab-btn ${tab === 'event' ? 'active' : ''}`} onClick={() => changeTab('event')}>Event</button>
          </div>

          {tab === 'event' && events.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <select className="form-select" value={selectedEventId} onChange={e => changeEvent(e.target.value)}>
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
              pagedTxns.map(txn => (
                <TxnRow key={txn.id} txn={txn} divisionId={division.id} eventName={getEventName(txn.eventId)} onEdit={() => setEditTxn(txn)} onDelete={() => handleDeleteTxn(txn)} isPending={isPending} readOnly={readOnly} />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}
              >← Prev</button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                style={{ fontSize: 13, padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}
              >Next →</button>
            </div>
          )}
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
