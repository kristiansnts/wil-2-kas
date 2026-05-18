'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { fmt, fmtShort, fmtDate, initials, todayStr } from '@/lib/format'
import { RupiahInput } from '@/components/ui/RupiahInput'
import { DateInput } from '@/components/ui/DateInput'
import { addTxnUmum, addDivision, deleteTxnUmum, updateTxnUmum, updateDivision, deleteDivision, addSetorMD } from '@/lib/actions/kas'
import { logout } from '@/lib/actions/auth'
import type { DivisionItem, TxnUmumItem } from '@/lib/types'

interface MeetingItem {
  id: string
  month: string
  totalPersepuluhan: number
  setorDate: string | null
  setorNetAmount: number | null
  setorItems: { id: string; desc: string; amount: number }[]
}

interface Props {
  balance: number
  divisions: DivisionItem[]
  transactions: TxnUmumItem[]
  meetings: MeetingItem[]
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    plus:     <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    minus:    <line x1="5" y1="12" x2="19" y2="12" />,
    transfer: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    group:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    trash:    <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></>,
    pencil:   <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    log:      <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    print:    <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
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

function TxnRow({ txn, onEdit, onDelete, isPending }: { txn: TxnUmumItem; onEdit: () => void; onDelete: () => void; isPending: boolean }) {
  const [confirm, setConfirm] = useState(false)
  const isTransfer = !!txn.refDivId
  return (
    <div className="txn-row">
      <div className={`txn-icon ${txn.type}`}>{txn.type === 'masuk' ? '↑' : '↓'}</div>
      <div className="txn-info">
        <div className="txn-desc">{txn.desc}</div>
        <div className="txn-meta">
          <span className="txn-meta-date">{fmtDate(txn.date)}</span>
          <span className={`badge ${txn.type}`}>{txn.type}</span>
          {isTransfer && <span className="badge transfer">transfer</span>}
        </div>
      </div>
      {confirm ? (
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
          {!isTransfer && (
            <button onClick={onEdit} disabled={isPending} style={{ ...btnIcon, background: 'var(--accent)', color: 'white' }}>
              <Icon name="pencil" size={15} />
            </button>
          )}
          <button onClick={() => setConfirm(true)} disabled={isPending} style={{ ...btnIcon, background: 'var(--red)', color: 'white' }}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function FormEditTxnUmumSheet({ txn, onClose, onSave, isPending }: {
  txn: TxnUmumItem
  onClose: () => void
  onSave: (payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string }) => void
  isPending: boolean
}) {
  const [tipe, setTipe] = useState(txn.type)
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
    onSave({ type: tipe, amount, desc: keterangan, date: tanggal })
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
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CopyLinkButton({ divId }: { divId: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/divisi/${divId}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} title="Salin link dashboard" style={{
      flexShrink: 0, width: 36, height: 36, border: 'none', borderRadius: 10,
      background: copied ? 'var(--green-light)' : 'var(--bg)',
      color: copied ? 'var(--green)' : 'var(--subtle)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginRight: 12, transition: 'all 0.15s', fontSize: 14,
    }}>
      {copied ? '✓' : (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
    </button>
  )
}

function FormTxnUmumSheet({ tipeInit, onClose, onSave, isPending }: {
  tipeInit: 'masuk' | 'keluar'
  onClose: () => void
  onSave: (payload: Parameters<typeof addTxnUmum>[0]) => void
  isPending: boolean
}) {
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>(tipeInit)
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
    onSave({ type: tipe, amount, desc: keterangan, date: tanggal, isTransfer: false })
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
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormTransferSheet({ divisions, onClose, onSave, isPending }: {
  divisions: DivisionItem[]
  onClose: () => void
  onSave: (payload: Parameters<typeof addTxnUmum>[0]) => void
  isPending: boolean
}) {
  const [refDivId, setRefDivId] = useState(divisions[0]?.id ?? '')
  const [jumlah, setJumlah] = useState('')
  const [tanggal, setTanggal] = useState(todayStr())
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    const amount = parseInt(jumlah) || 0
    if (!amount || !refDivId) return
    submittingRef.current = true
    onSave({ type: 'keluar', amount, desc: '', date: tanggal, isTransfer: true, refDivId })
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Transfer ke Komisi</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Komisi Tujuan</label>
            {divisions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>Belum ada komisi.</div>
            ) : (
              <select className="form-select" value={refDivId} onChange={e => setRefDivId(e.target.value)}>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah</label>
            <RupiahInput value={jumlah} onChange={setJumlah} required />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <DateInput className="form-input" value={tanggal} onChange={setTanggal} required />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending || divisions.length === 0} style={{ marginTop: 4 }}>
            {isPending ? 'Memproses...' : 'Transfer'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormBuatKomisiSheet({ onClose, onSave, isPending }: {
  onClose: () => void
  onSave: (payload: Parameters<typeof addDivision>[0]) => void
  isPending: boolean
}) {
  const [nama, setNama] = useState('')
  const [saldoAwal, setSaldoAwal] = useState('')
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    if (!nama) return
    submittingRef.current = true
    onSave({ name: nama, initialBalance: parseInt(saldoAwal) || 0 })
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Buat Komisi Baru</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nama Komisi</label>
            <input className="form-input" type="text" placeholder="cth. Acara, Humas" value={nama} onChange={e => setNama(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Saldo Awal (opsional)</label>
            <RupiahInput value={saldoAwal} onChange={setSaldoAwal} />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Membuat...' : 'Buat Komisi'}
          </button>
        </form>
      </div>
    </div>
  )
}

const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
function fmtYM(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
}

function FormCetakLaporanSheet({ meetings, onClose }: { meetings: MeetingItem[]; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState(meetings[0]?.id ?? '')
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!selectedId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/laporan/export?meetingId=${selectedId}`)
      if (!res.ok) throw new Error('Gagal mengunduh')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? 'laporan-bulanan.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Cetak Laporan Bulanan</div>
        {meetings.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 12 }}>Belum ada pertemuan yang tercatat.</div>
        ) : (
          <>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Pilih Bulan</label>
              <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {meetings.map(m => (
                  <option key={m.id} value={m.id}>{fmtYM(m.month)}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>
              Mengunduh 3 sheet: Laporan Lengkap, MD, dan Dana Kesejahteraan.
            </div>
            <button
              className="submit-btn"
              onClick={handleDownload}
              disabled={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? 'Mengunduh...' : '⬇ Unduh Excel'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function FormSetorMDSheet({ meetings, onClose, onDone }: {
  meetings: MeetingItem[]
  onClose: () => void
  onDone: () => void
}) {
  const [selectedId, setSelectedId] = useState(meetings[0]?.id ?? '')
  const [editing, setEditing] = useState(false)
  const [tanggal, setTanggal] = useState(todayStr())
  const [items, setItems] = useState<{ key: number; desc: string; amount: string }[]>([])
  const [saving, setSaving] = useState(false)
  const keyRef = useRef(0)
  const submittingRef = useRef(false)

  const selected = meetings.find(m => m.id === selectedId)
  const hasExisting = !!(selected?.setorDate)
  const amount85 = selected ? Math.round(selected.totalPersepuluhan * 0.85) : 0
  const totalBantuan = items.reduce((s, i) => s + (parseInt(i.amount) || 0), 0)
  const netSetor = amount85 - totalBantuan

  function loadExisting(m: MeetingItem) {
    setTanggal(m.setorDate ? m.setorDate.slice(0, 10) : todayStr())
    setItems(m.setorItems.map(i => ({ key: ++keyRef.current, desc: i.desc, amount: String(i.amount) })))
  }

  function handleSelectChange(id: string) {
    setSelectedId(id)
    setEditing(false)
    const m = meetings.find(x => x.id === id)
    if (m?.setorDate) loadExisting(m)
    else { setTanggal(todayStr()); setItems([]) }
  }

  function handleEdit() {
    if (selected) loadExisting(selected)
    setEditing(true)
  }

  function addItem() { setItems(prev => [...prev, { key: ++keyRef.current, desc: '', amount: '' }]) }
  function removeItem(key: number) { setItems(prev => prev.filter(i => i.key !== key)) }
  function updateItem(key: number, field: 'desc' | 'amount', val: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: val } : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || saving || !selected || netSetor <= 0) return
    const parsedItems = items.map(i => ({ desc: i.desc.trim(), amount: parseInt(i.amount) || 0 })).filter(i => i.desc && i.amount > 0)
    submittingRef.current = true
    setSaving(true)
    await addSetorMD({ meetingId: selected.id, setorNetAmount: netSetor, date: tanggal, items: parsedItems })
    onDone()
  }

  // Show existing data in view mode
  const showView = hasExisting && !editing

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Setor MD</div>
        {meetings.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 12 }}>Belum ada pertemuan yang tercatat.</div>
        ) : (
          <>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="form-label">Pertemuan</label>
              <select className="form-select" value={selectedId} onChange={e => handleSelectChange(e.target.value)}>
                {meetings.map(m => (
                  <option key={m.id} value={m.id}>
                    {fmtYM(m.month)}{m.setorDate ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </div>

            {showView && selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                  Dicatat {fmtDate(selected.setorDate!)}
                </div>
                <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>Total persepuluhan</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(selected.totalPersepuluhan)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>85% alokasi MD</span>
                    <span style={{ fontSize: 13 }}>{fmt(Math.round(selected.totalPersepuluhan * 0.85))}</span>
                  </div>
                  {selected.setorItems.length > 0 && (
                    <>
                      <div style={{ height: 1, background: 'var(--border)' }} />
                      {selected.setorItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{item.desc}</span>
                          <span style={{ fontSize: 12, color: 'var(--red)', whiteSpace: 'nowrap', flexShrink: 0 }}>− {fmt(item.amount)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Net Setor KAS MD</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{fmt(selected.setorNetAmount ?? 0)}</span>
                  </div>
                </div>
                <button onClick={handleEdit} style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  Edit Data Setor
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                {selected && (
                  <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>Total persepuluhan</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(selected.totalPersepuluhan)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>85% alokasi MD</span>
                      <span style={{ fontSize: 13 }}>{fmt(amount85)}</span>
                    </div>
                    {totalBantuan > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>Bantuan (pengurang)</span>
                        <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>− {fmt(totalBantuan)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Net Setor KAS MD</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: netSetor > 0 ? 'var(--accent)' : 'var(--text-sub)' }}>{fmt(netSetor)}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Pengurang / Bantuan</label>
                    <button type="button" onClick={addItem} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>
                      + Tambah
                    </button>
                  </div>
                  {items.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Tidak ada — tekan Tambah untuk menambah item.</div>
                  )}
                  {items.map(item => (
                    <div key={item.key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input className="form-input" type="text" placeholder="Keterangan" value={item.desc} onChange={e => updateItem(item.key, 'desc', e.target.value)} style={{ flex: 2, minWidth: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <RupiahInput value={item.amount} onChange={v => updateItem(item.key, 'amount', v)} />
                      </div>
                      <button type="button" onClick={() => removeItem(item.key)} style={{ ...btnIcon, background: 'var(--red-light)', color: 'var(--red)', flexShrink: 0 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <DateInput className="form-input" value={tanggal} onChange={setTanggal} required />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editing && (
                    <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      Batal
                    </button>
                  )}
                  <button type="submit" className="submit-btn" disabled={saving || netSetor <= 0} style={{ flex: 2, marginTop: 0 }}>
                    {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Catat Setor MD'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type SheetState = null | 'masuk' | 'keluar' | 'transfer' | 'buat-komisi' | 'setor-md' | 'cetak-laporan'

export default function KasUmumClient({ balance, divisions, transactions, meetings }: Props) {
  const today = todayStr()
  const [sheet, setSheet] = useState<SheetState>(null)
  const [editTxn, setEditTxn] = useState<TxnUmumItem | null>(null)
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()

  const totalMasuk = transactions.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
  const totalKeluar = transactions.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)

  const PAGE_SIZE = 10
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE)
  const pagedTxns = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSaveTxn(payload: Parameters<typeof addTxnUmum>[0]) {
    startTransition(async () => {
      await addTxnUmum(payload)
      setSheet(null)
    })
  }

  function handleSaveDivision(payload: Parameters<typeof addDivision>[0]) {
    startTransition(async () => {
      await addDivision(payload)
      setSheet(null)
    })
  }

  function handleDeleteTxn(txn: TxnUmumItem) {
    startTransition(async () => {
      await deleteTxnUmum(txn.id, txn.amount, txn.type, txn.refDivId)
    })
  }

  function handleUpdateTxn(payload: { type: 'masuk' | 'keluar'; amount: number; desc: string; date: string }) {
    if (!editTxn) return
    startTransition(async () => {
      await updateTxnUmum(editTxn.id, editTxn.amount, editTxn.type, payload)
      setEditTxn(null)
    })
  }

  return (
    <div className="screen">
      <div className="topnav">
        <div style={{ flex: 1 }}>
          <div className="topnav-title">Kas Umum</div>
          <div className="topnav-sub">Bendahara Umum · {fmtDate(today)}</div>
        </div>
        <Link href="/log" style={{ fontSize: 13, color: 'var(--muted)', padding: '6px 8px' }}>Log</Link>
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
          <div className="balance-label">Saldo Kas Umum</div>
          <div className="balance-amount">{fmt(balance)}</div>
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

        <div className="actions-grid">
          <button className="action-btn" onClick={() => setSheet('masuk')}>
            <div className="action-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><Icon name="plus" /></div>
            <div className="action-label">Pemasukan</div>
          </button>
          <button className="action-btn" onClick={() => setSheet('keluar')}>
            <div className="action-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}><Icon name="minus" /></div>
            <div className="action-label">Pengeluaran</div>
          </button>
          <button className="action-btn" onClick={() => setSheet('transfer')}>
            <div className="action-icon" style={{ background: 'oklch(0.93 0.05 250)', color: 'var(--accent)' }}><Icon name="transfer" /></div>
            <div className="action-label">Transfer</div>
          </button>
          <button className="action-btn" onClick={() => setSheet('buat-komisi')}>
            <div className="action-icon" style={{ background: 'oklch(0.93 0.06 310)', color: 'oklch(0.42 0.16 310)' }}><Icon name="group" /></div>
            <div className="action-label">Buat Komisi</div>
          </button>
          <button className="action-btn" onClick={() => setSheet('setor-md')}>
            <div className="action-icon" style={{ background: 'oklch(0.93 0.08 55)', color: 'oklch(0.45 0.14 55)', fontWeight: 700, fontSize: 13 }}>MD</div>
            <div className="action-label">Setor MD</div>
          </button>
          <button className="action-btn" onClick={() => setSheet('cetak-laporan')}>
            <div className="action-icon" style={{ background: 'oklch(0.93 0.06 160)', color: 'oklch(0.42 0.14 160)' }}>
              <Icon name="print" />
            </div>
            <div className="action-label">Laporan Bulanan</div>
          </button>
        </div>

        <Link href="/pertemuan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, textDecoration: 'none', color: 'inherit' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Pertemuan Wilayah</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>Kelola pertemuan bulanan pendeta</div>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-sub)', flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <div>
          <div className="section-header">
            <div className="section-title">Transaksi Terbaru</div>
          </div>
          <div style={{ marginTop: 10 }} className="card">
            {transactions.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div className="empty-text">Belum ada transaksi</div>
              </div>
            ) : (
              pagedTxns.map(txn => <TxnRow key={txn.id} txn={txn} onEdit={() => setEditTxn(txn)} onDelete={() => handleDeleteTxn(txn)} isPending={isPending} />)
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

        <div>
          <div className="section-header">
            <div className="section-title">Komisi ({divisions.length})</div>
          </div>
          <div className="card" style={{ marginTop: 10, padding: 0 }}>
            {divisions.length === 0 ? (
              <div className="empty">
                <div className="empty-text">Belum ada komisi</div>
              </div>
            ) : (
              divisions.map(div => (
                <div key={div.id} className="div-row" style={{ padding: 0 }}>
                  <Link
                    href={`/divisi/${div.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 12px 16px', flex: 1, textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="div-avatar">{initials(div.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="div-name">{div.name}</div>
                      <div className="div-balance">{fmt(div.balance)}</div>
                    </div>
                  </Link>
                  <CopyLinkButton divId={div.id} />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      {sheet === 'masuk' && (
        <FormTxnUmumSheet tipeInit="masuk" onClose={() => setSheet(null)} onSave={handleSaveTxn} isPending={isPending} />
      )}
      {sheet === 'keluar' && (
        <FormTxnUmumSheet tipeInit="keluar" onClose={() => setSheet(null)} onSave={handleSaveTxn} isPending={isPending} />
      )}
      {sheet === 'transfer' && (
        <FormTransferSheet divisions={divisions} onClose={() => setSheet(null)} onSave={handleSaveTxn} isPending={isPending} />
      )}
      {sheet === 'buat-komisi' && (
        <FormBuatKomisiSheet onClose={() => setSheet(null)} onSave={handleSaveDivision} isPending={isPending} />
      )}
      {sheet === 'setor-md' && (
        <FormSetorMDSheet meetings={meetings} onClose={() => setSheet(null)} onDone={() => setSheet(null)} />
      )}
      {sheet === 'cetak-laporan' && (
        <FormCetakLaporanSheet meetings={meetings} onClose={() => setSheet(null)} />
      )}
      {editTxn && (
        <FormEditTxnUmumSheet txn={editTxn} onClose={() => setEditTxn(null)} onSave={handleUpdateTxn} isPending={isPending} />
      )}
    </div>
  )
}
