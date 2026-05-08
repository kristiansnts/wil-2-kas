'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { LogItem } from '@/lib/types'

interface FilterOption { id: string; name: string }

interface Props {
  logs: LogItem[]
  backHref: string
  isAdmin: boolean
  divisions: FilterOption[]
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
}

function entityLabel(entity: string): string {
  const map: Record<string, string> = {
    transaksi_umum: 'Kas Umum',
    transaksi_divisi: 'Kas Komisi',
    komisi: 'Komisi',
    event: 'Event',
  }
  return map[entity] ?? entity
}

function inferDir(log: LogItem): 'masuk' | 'keluar' | null {
  const d = log.desc.toLowerCase()
  if (d.includes('pemasukan')) return 'masuk'
  if (d.includes('pengeluaran')) return 'keluar'
  return null
}

export default function LogClient({ logs, backHref, isAdmin, divisions }: Props) {
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [entityType, setEntityType] = useState('')
  const [dir, setDir] = useState('')
  const [action, setAction] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('')

  const availableMonths = useMemo(() => {
    const set = new Set(logs.map(l => l.createdAt.slice(0, 7)))
    return [...set].sort().reverse()
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (search && !log.desc.toLowerCase().includes(search.toLowerCase())) return false
      if (month && log.createdAt.slice(0, 7) !== month) return false
      if (entityType === 'transaksi' && !log.entity.startsWith('transaksi')) return false
      if (entityType === 'event' && log.entity !== 'event') return false
      if (entityType === 'komisi' && log.entity !== 'komisi') return false
      if (dir && inferDir(log) !== dir) return false
      if (action && log.action !== action) return false
      if (divisionFilter && (log.divisionId !== divisionFilter || log.actorRole === 'admin')) return false
      return true
    })
  }, [logs, search, month, entityType, dir, action, divisionFilter])

  const hasFilter = search || month || entityType || dir || action || divisionFilter

  function resetAll() {
    setSearch(''); setMonth(''); setEntityType(''); setDir('')
    setAction(''); setDivisionFilter('')
  }

  return (
    <div className="screen">
      <div className="topnav">
        <Link href={backHref} className="back-btn">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topnav-title">Log Aktivitas</div>
          <div className="topnav-sub">{filtered.length} dari {logs.length} entri</div>
        </div>
        {hasFilter && (
          <button onClick={resetAll} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', flexShrink: 0 }}>
            Reset
          </button>
        )}
      </div>

      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="form-input"
            type="search"
            placeholder="Cari deskripsi log..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 14 }}
          />
          <div className="log-filter-row">
            <select className="log-filter-select" value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">Semua bulan</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
            <select className="log-filter-select" value={entityType} onChange={e => setEntityType(e.target.value)}>
              <option value="">Semua tipe</option>
              <option value="transaksi">Transaksi</option>
              <option value="event">Event</option>
              <option value="komisi">Komisi</option>
            </select>
            <select className="log-filter-select" value={dir} onChange={e => setDir(e.target.value)}>
              <option value="">Semua arah</option>
              <option value="masuk">Pemasukan</option>
              <option value="keluar">Pengeluaran</option>
            </select>
            <select className="log-filter-select" value={action} onChange={e => setAction(e.target.value)}>
              <option value="">Semua aksi</option>
              <option value="tambah">Tambah</option>
              <option value="ubah">Ubah</option>
              <option value="hapus">Hapus</option>
            </select>
            {isAdmin && (
              <select className="log-filter-select" value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}>
                <option value="">Semua komisi</option>
                {divisions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">Tidak ada log yang cocok</div>
            </div>
          </div>
        ) : (
          <div className="card">
            {filtered.map(log => {
              const isHapus = log.action === 'hapus'
              const isUbah = log.action === 'ubah'
              return (
                <div key={log.id} className="log-row">
                  <div className={`log-icon ${isHapus ? 'hapus' : isUbah ? 'ubah' : 'tambah'}`}>
                    {isHapus ? '−' : isUbah ? '↻' : '+'}
                  </div>
                  <div className="log-info">
                    <div className="log-desc">{log.desc}</div>
                    <div className="log-meta">
                      <span className="log-time">{fmtDateTime(log.createdAt)}</span>
                      <span className={`badge ${log.actorRole === 'admin' ? 'masuk' : 'harian'}`}>
                        {log.actorRole === 'admin' ? 'Bendahara Umum' : 'Bendahara Komisi'}
                      </span>
                      <span className="badge transfer">{entityLabel(log.entity)}</span>
                      {log.actorRole !== 'admin' && log.divisionName && (
                        <span className="badge event">{log.divisionName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}
