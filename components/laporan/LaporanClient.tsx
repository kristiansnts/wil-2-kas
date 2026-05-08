'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { fmt, fmtDate } from '@/lib/format'

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

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
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

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const d = t.date.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
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
  }, [transactions, dateFrom, dateTo, filterType, filterScope, filterDiv, filteredEventId, search, isAdmin])

  const totalMasuk = filtered.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
  const totalKeluar = filtered.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
  const saldo = totalMasuk - totalKeluar

  const fixedDiv = fixedDivisionId ? divisions.find(d => d.id === fixedDivisionId) : null
  const pageTitle = fixedDiv ? `Laporan – ${fixedDiv.name}` : 'Laporan Keuangan'

  const showEventFilter = visibleEvents.length > 0

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
          <button
            onClick={() => window.print()}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 10,
              padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6, color: '#1c1917',
            }}
          >
            <PrintIcon />
            Cetak
          </button>
        </div>

        <div className="content">
          {/* Filters */}
          <div className="card no-print" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Dari</label>
                <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sampai</label>
                <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
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
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Tanggal</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Deskripsi</th>
                    {isAdmin && (
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Sumber</th>
                    )}
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
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

          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  )
}
