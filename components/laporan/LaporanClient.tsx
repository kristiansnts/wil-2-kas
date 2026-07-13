'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { fmt, fmtDate } from '@/lib/format'
import { DateInput } from '@/components/ui/DateInput'

interface TxnRow {
  id: string
  date: string
  desc: string
  amount: number
  type: 'masuk' | 'keluar'
  scope: 'umum' | 'divisi'
  kategori: 'harian' | 'event' | null
  divisionId: string | null
  divisionName: string | null
  eventId: string | null
  eventName: string | null
}

interface DivisionOption {
  id: string
  name: string
}

interface EventOption {
  id: string
  name: string
  divisionId: string
}

interface Props {
  transactions: TxnRow[]
  divisions: DivisionOption[]
  events: EventOption[]
  isAdmin: boolean
  fixedDivisionId: string | null
}

function getPageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, current, current - 1, current + 1].filter(n => n >= 1 && n <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const result: (number | '…')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}


function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export default function LaporanClient({ transactions, divisions, events, isAdmin, fixedDivisionId }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 7) + '-01'

  const [filterDiv, setFilterDiv] = useState<string>('all')
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all')
  const [filterScope, setFilterScope] = useState<'all' | 'umum' | 'divisi'>('all')
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)
  const [search, setSearch] = useState('')
  const [includeDK, setIncludeDK] = useState(true)
  const [sortCol, setSortCol] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportMode, setExportMode] = useState<'pick' | 'range' | 'event'>('pick')
  const [exportFrom, setExportFrom] = useState(monthStart)
  const [exportTo, setExportTo] = useState(today)
  const [exportEventId, setExportEventId] = useState('')

  function toggleSort(col: 'date' | 'amount') {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(col === 'amount' ? 'desc' : 'desc')
    }
    setPage(1)
  }

  // Determine which division context is active for event filtering
  const activeDivisionId = useMemo(() => {
    if (fixedDivisionId) return fixedDivisionId
    if (isAdmin && filterDiv !== 'all' && filterDiv !== 'umum') return filterDiv
    return null
  }, [fixedDivisionId, isAdmin, filterDiv])

  // Events relevant to the current filter context
  const visibleEvents = useMemo(() => {
    if (activeDivisionId) return events.filter(e => e.divisionId === activeDivisionId)
    if (!isAdmin || filterScope === 'divisi') return events
    return []
  }, [events, activeDivisionId, isAdmin, filterScope])

  // Reset event filter when visible events change
  const filteredEventId = visibleEvents.some(e => e.id === filterEvent) ? filterEvent : 'all'

  const PAGE_SIZE = 10

  const isDK = (t: TxnRow) =>
    t.desc.startsWith('Persepuluhan ') || t.desc.startsWith('Wadah ')

  const filtered = useMemo(() => {
    setPage(1)
    return transactions.filter(t => {
      const d = t.date.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      if (!includeDK && isDK(t)) return false
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterScope !== 'all' && t.scope !== filterScope) return false
      if (isAdmin && filterDiv !== 'all') {
        if (filterDiv === 'umum' && t.scope !== 'umum') return false
        if (filterDiv !== 'umum' && t.divisionId !== filterDiv) return false
      }
      if (filteredEventId !== 'all' && t.eventId !== filteredEventId) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.desc.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [transactions, dateFrom, dateTo, includeDK, filterType, filterScope, filterDiv, filteredEventId, search, isAdmin])

  const totalMasuk = filtered.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
  const totalKeluar = filtered.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
  const saldo = totalMasuk - totalKeluar

  const sorted = useMemo(() => {
    const mul = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortCol === 'amount') return (a.amount - b.amount) * mul
      return a.date.localeCompare(b.date) * mul
    })
  }, [filtered, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const fixedDiv = fixedDivisionId ? divisions.find(d => d.id === fixedDivisionId) : null
  const pageTitle = fixedDiv ? `Laporan – ${fixedDiv.name}` : 'Laporan Keuangan'

  const showEventFilter = visibleEvents.length > 0

  const exportEvents = useMemo(() => {
    if (fixedDivisionId) return events.filter(e => e.divisionId === fixedDivisionId)
    if (isAdmin && filterDiv !== 'all' && filterDiv !== 'umum') {
      return events.filter(e => e.divisionId === filterDiv)
    }
    return events
  }, [events, fixedDivisionId, isAdmin, filterDiv])

  function openExportModal() {
    setExportMode('pick')
    setExportFrom(dateFrom)
    setExportTo(dateTo)
    setExportEventId(filteredEventId !== 'all' ? filteredEventId : (exportEvents[0]?.id ?? ''))
    setShowExportModal(true)
  }

  function buildExportUrl(mode: 'range' | 'event') {
    const params = new URLSearchParams()
    if (mode === 'range') {
      if (exportFrom) params.set('from', exportFrom)
      if (exportTo) params.set('to', exportTo)
    } else {
      params.set('eventId', exportEventId)
    }
    if (isAdmin) {
      if (filterDiv !== 'all') params.set('divisionId', filterDiv)
      else if (filterScope !== 'all') params.set('scope', filterScope)
    }
    if (!includeDK) params.set('includeDK', '0')
    return `/api/laporan/transaksi/export?${params.toString()}`
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .screen { min-height: unset; }
          .topnav { position: static; }
          body { background: white; }
          .card { border: 1px solid #ddd; }
          .laporan-table td, .laporan-table th { padding: 6px 10px; }
        }
      `}</style>

      <div className="screen">
        <div className="topnav no-print">
          <Link href={fixedDivisionId ? `/divisi/${fixedDivisionId}` : '/'} className="back-btn">
            <BackIcon />
          </Link>
          <div>
            <div className="topnav-title">{pageTitle}</div>
          </div>
          <div />
        </div>

        <div className="content">
          {/* Filters */}
          <div className="card no-print" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Dari</label>
              <DateInput className="form-input" value={dateFrom} onChange={setDateFrom} />
            </div>
            <div className="form-group">
              <label className="form-label">Sampai</label>
              <DateInput className="form-input" value={dateTo} onChange={setDateTo} />
            </div>

            <div className="seg-control">
              {(['all', 'masuk', 'keluar'] as const).map(v => (
                <button key={v} className={`seg-btn${filterType === v ? ` active${v !== 'all' ? ' ' + v : ''}` : ''}`} onClick={() => setFilterType(v)}>
                  {v === 'all' ? 'Semua' : v === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                </button>
              ))}
            </div>

            {isAdmin && (
              <div className="seg-control">
                {(['all', 'umum', 'divisi'] as const).map(v => (
                  <button key={v} className={`seg-btn${filterScope === v ? ' active' : ''}`} onClick={() => { setFilterScope(v); setFilterDiv('all'); setFilterEvent('all') }}>
                    {v === 'all' ? 'Semua' : v === 'umum' ? 'Kas Umum' : 'Divisi'}
                  </button>
                ))}
              </div>
            )}

            {isAdmin && filterScope !== 'umum' && (
              <select
                className="form-select"
                value={filterDiv}
                onChange={e => { setFilterDiv(e.target.value); setFilterEvent('all') }}
              >
                <option value="all">Semua Divisi</option>
                {filterScope === 'all' && <option value="umum">Kas Umum</option>}
                {divisions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {showEventFilter && (
              <select
                className="form-select"
                value={filteredEventId}
                onChange={e => setFilterEvent(e.target.value)}
              >
                <option value="all">Semua Event</option>
                {visibleEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="form-input"
              placeholder="Cari deskripsi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setIncludeDK(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 13, color: '#1c1917', textAlign: 'left',
              }}
            >
              <span
                className={`toggle${includeDK ? ' on' : ''}`}
                style={{ flexShrink: 0 }}
              />
              <span>Termasuk Dana Kesejahteraan</span>
            </button>

            <button type="button" className="submit-btn" onClick={openExportModal}>
              Unduh Excel
            </button>
          </div>

          {/* Summary */}
          <div className="stats-row">
            <div className="stat-pill">
              <div className="stat-pill-label">Pemasukan</div>
              <div className="stat-pill-val green">{fmt(totalMasuk)}</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-label">Pengeluaran</div>
              <div className="stat-pill-val red">{fmt(totalKeluar)}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Saldo Periode</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(saldo)}</span>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                Tidak ada transaksi
              </div>
            ) : (
              <table className="laporan-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                    <th
                      onClick={() => toggleSort('date')}
                      style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: sortCol === 'date' ? '#1c1917' : 'var(--muted)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                    >
                      Tanggal {sortCol === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Deskripsi</th>
                    {isAdmin && (
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Sumber</th>
                    )}
                    <th
                      onClick={() => toggleSort('amount')}
                      style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: sortCol === 'amount' ? '#1c1917' : 'var(--muted)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                    >
                      Jumlah {sortCol === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t, i) => (
                    <tr key={t.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{fmtDate(t.date)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{t.desc}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                          {t.kategori && <span className={`badge ${t.kategori}`}>{t.kategori}</span>}
                          {t.eventName && <span className="badge event">{t.eventName}</span>}
                        </div>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                          {t.scope === 'umum' ? (
                            <span className="badge transfer">Kas Umum</span>
                          ) : (
                            <span className="badge">{t.divisionName ?? '—'}</span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ color: t.type === 'masuk' ? 'var(--green)' : 'var(--red)' }}>
                          {t.type === 'masuk' ? '+' : '-'}{fmt(t.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, paddingTop: 4, flexWrap: 'wrap' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{
                  minWidth: 40, height: 40, border: '1px solid var(--border)', borderRadius: 10,
                  background: 'none', cursor: safePage === 1 ? 'default' : 'pointer',
                  color: safePage === 1 ? 'var(--muted)' : 'inherit', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ‹
              </button>
              {getPageWindow(safePage, totalPages).map((n, i) =>
                n === '…' ? (
                  <span key={`ellipsis-${i}`} style={{ color: 'var(--muted)', fontSize: 13, padding: '0 2px', lineHeight: '40px' }}>…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    style={{
                      minWidth: 40, height: 40, border: '1px solid var(--border)', borderRadius: 10,
                      background: safePage === n ? 'var(--accent)' : 'none',
                      color: safePage === n ? '#fff' : 'inherit',
                      cursor: 'pointer', fontSize: 13, fontWeight: safePage === n ? 600 : 400,
                    }}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{
                  minWidth: 40, height: 40, border: '1px solid var(--border)', borderRadius: 10,
                  background: 'none', cursor: safePage === totalPages ? 'default' : 'pointer',
                  color: safePage === totalPages ? 'var(--muted)' : 'inherit', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ›
              </button>
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>
      </div>

      {showExportModal && (
        <div
          className="no-print"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 340, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {exportMode === 'pick' ? 'Unduh Excel' : exportMode === 'range' ? 'Per Range Tanggal' : 'Per Event'}
              </div>
              {exportMode !== 'pick' && (
                <button
                  type="button"
                  onClick={() => setExportMode('pick')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Kembali
                </button>
              )}
            </div>

            {exportMode === 'pick' && (
              <>
                <button
                  type="button"
                  onClick={() => setExportMode('range')}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Per Range Tanggal</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>›</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('event')}
                  disabled={exportEvents.length === 0}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: 'none', background: 'none', cursor: exportEvents.length === 0 ? 'default' : 'pointer', color: exportEvents.length === 0 ? 'var(--muted)' : 'inherit', textAlign: 'left' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Per Event</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {exportEvents.length === 0 ? 'Tidak ada event' : '›'}
                  </span>
                </button>
              </>
            )}

            {exportMode === 'range' && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Dari</label>
                  <DateInput className="form-input" value={exportFrom} onChange={setExportFrom} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sampai</label>
                  <DateInput className="form-input" value={exportTo} onChange={setExportTo} />
                </div>
                <a
                  href={buildExportUrl('range')}
                  className="submit-btn"
                  style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}
                  onClick={() => setShowExportModal(false)}
                >
                  Unduh Excel
                </a>
              </div>
            )}

            {exportMode === 'event' && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Event</label>
                  <select
                    className="form-select"
                    value={exportEventId}
                    onChange={e => setExportEventId(e.target.value)}
                  >
                    {exportEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <a
                  href={exportEventId ? buildExportUrl('event') : undefined}
                  className="submit-btn"
                  style={{
                    textAlign: 'center', textDecoration: 'none', display: 'block',
                    opacity: exportEventId ? 1 : 0.6,
                    pointerEvents: exportEventId ? 'auto' : 'none',
                  }}
                  onClick={() => setShowExportModal(false)}
                >
                  Unduh Excel
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
