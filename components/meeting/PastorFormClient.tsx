'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { submitPastorForm } from '@/lib/actions/submission'
import { RupiahInput } from '@/components/ui/RupiahInput'

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

interface PastorOption {
  id: string
  name: string
  title: string
  pelayanan: string | null
  alreadySubmitted: boolean
}

interface DivisionOption {
  id: string
  name: string
}

function PastorCombobox({ pastors, value, onChange }: {
  pastors: PastorOption[]
  value: string
  onChange: (id: string) => void
}) {
  const selected = pastors.find(p => p.id === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? pastors.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : pastors

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function handleOpen() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpen(o => !o)
    setQuery('')
  }

  function pick(p: PastorOption) {
    onChange(p.id)
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="form-input"
        onClick={handleOpen}
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
      >
        {selected ? (
          <span style={{ flex: 1 }}>{selected.name} <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>({selected.title.toUpperCase()})</span></span>
        ) : (
          <span style={{ flex: 1, color: 'var(--text-sub)' }}>— Pilih nama —</span>
        )}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.4 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && dropRect && (
        <div
          ref={containerRef}
          style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}
        >
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              className="form-input"
              autoFocus
              type="search"
              placeholder="Cari nama..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ fontSize: 14 }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-sub)' }}>Tidak ada hasil</div>
            ) : filtered.map((p, i) => (
              <div
                key={p.id}
                onMouseDown={e => { e.preventDefault(); pick(p) }}
                onMouseEnter={e => { if (p.id !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-light)' }}
                onMouseLeave={e => { if (p.id !== value) (e.currentTarget as HTMLDivElement).style.background = '' }}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: p.id === value ? 'var(--accent-light)' : undefined,
                }}
              >
                <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{p.title.toUpperCase()}</span>
                {p.alreadySubmitted && <span className="badge masuk" style={{ fontSize: 11 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

interface Props {
  token: string
  month: string
  deadline: string
  pastors: PastorOption[]
  divisions: DivisionOption[]
}

export default function PastorFormClient({ token, month, deadline, pastors, divisions }: Props) {
  const [selectedPastorId, setSelectedPastorId] = useState('')
  const [persepuluhan, setPersepuluhan] = useState('')
  const [bulan, setBulan] = useState('1')
  const [wadah, setWadah] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const submittingRef = useRef(false)

  const selectedPastor = pastors.find(p => p.id === selectedPastorId)

  function handleSelect(id: string) {
    setSelectedPastorId(id)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending || !selectedPastorId) return
    submittingRef.current = true
    setError('')

    const wadahEntries = divisions
      .map(d => ({ divisionId: d.id, amount: parseInt(wadah[d.id] || '0') || 0 }))
      .filter(w => w.amount > 0)

    startTransition(async () => {
      const result = await submitPastorForm({
        token,
        pastorId: selectedPastorId,
        persepuluhan: parseInt(persepuluhan) || 0,
        bulan: parseInt(bulan) || 1,
        wadahEntries,
      })
      if (result.ok) {
        setDone(true)
      } else {
        setError(result.error ?? 'Terjadi kesalahan.')
        submittingRef.current = false
      }
    })
  }

  if (done) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Terima kasih!</div>
          <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            Formulir Pertemuan Wilayah {fmtMonth(month)} sudah diterima.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topnav">
        <div style={{ flex: 1 }}>
          <div className="topnav-title">Pertemuan Wilayah {fmtMonth(month)}</div>
          <div className="topnav-sub">Batas: {fmtDeadline(deadline)}</div>
        </div>
      </div>

      <div className="content">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: '16px' }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Nama Pendeta</div>
            <PastorCombobox pastors={pastors} value={selectedPastorId} onChange={handleSelect} />
          </div>

          {selectedPastor?.pelayanan && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 2 }}>Tempat Pelayanan</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedPastor.pelayanan}</div>
            </div>
          )}

          {selectedPastor?.alreadySubmitted ? (
            <div className="card" style={{ padding: '16px', background: 'oklch(0.93 0.1 145)' }}>
              <div style={{ fontSize: 14, color: 'oklch(0.35 0.12 145)', fontWeight: 500 }}>
                ✓ Formulir Anda sudah diterima untuk pertemuan ini.
              </div>
            </div>
          ) : selectedPastorId ? (
            <>
              <div className="card" style={{ padding: '16px' }}>
                <div className="form-label" style={{ marginBottom: 6 }}>Persepuluhan</div>
                <RupiahInput value={persepuluhan} onChange={setPersepuluhan} required />
              </div>

              {divisions.length > 0 && (
                <div className="card">
                  <div style={{ padding: '12px 16px 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' }}>
                    WADAH (OPSIONAL)
                  </div>
                  {divisions.map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <span style={{ fontSize: 14, fontWeight: 500, minWidth: 90, flexShrink: 0 }}>{d.name}</span>
                      <RupiahInput
                        value={wadah[d.id] ?? ''}
                        onChange={v => setWadah(prev => ({ ...prev, [d.id]: v }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="card" style={{ padding: '16px' }}>
                <div className="form-label" style={{ marginBottom: 6 }}>Untuk berapa bulan</div>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={bulan}
                  onChange={e => setBulan(e.target.value)}
                  required
                  style={{ maxWidth: 120 }}
                />
              </div>

              {error && (
                <div style={{ fontSize: 13, color: 'var(--red)', padding: '10px 14px', background: 'oklch(0.96 0.04 20)', borderRadius: 10 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isPending}>
                {isPending ? 'Mengirim...' : 'Kirim Formulir'}
              </button>
            </>
          ) : null}
        </form>
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
