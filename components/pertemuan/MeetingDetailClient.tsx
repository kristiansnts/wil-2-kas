'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { approveSubmission, editSubmission, adminAddSubmission } from '@/lib/actions/submission'
import { closeMeeting } from '@/lib/actions/meeting'
import { RupiahInput } from '@/components/ui/RupiahInput'
import { AlertModal } from '@/components/ui/AlertModal'
import type { MeetingDetailData, SubmissionItem, AvailablePastorItem } from '@/lib/types'
import { fmtDate } from '@/lib/format'

const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

function fmt(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function DetailModal({ sub, allWadah, onClose, onEdit, onApprove, isPending }: {
  sub: SubmissionItem
  allWadah: { id: string; name: string }[]
  onClose: () => void
  onEdit: () => void
  onApprove: () => void
  isPending: boolean
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}
      >
        <div style={{ padding: '18px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{sub.pastorName}</span>
              <span className={`badge pastor-title-${sub.pastorTitle}`}>{TITLE_LABEL[sub.pastorTitle] ?? sub.pastorTitle.toUpperCase()}</span>
            </div>
          </div>
          {sub.pastorPelayanan && (
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>{sub.pastorPelayanan}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Persepuluhan</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{fmt(sub.persepuluhan)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Untuk berapa bulan</span>
              <span className="badge">{sub.bulan} bulan</span>
            </div>
            {sub.wadahEntries.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                {sub.wadahEntries.map(w => (
                  <div key={w.divisionId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{w.divisionName}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(w.amount)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', display: 'flex' }}>
          <button
            onClick={onEdit}
            disabled={isPending}
            style={{ flex: 1, padding: '13px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-sub)', fontFamily: 'inherit' }}
          >
            Edit
          </button>
          <button
            onClick={onApprove}
            disabled={isPending || sub.status === 'approved'}
            style={{ flex: 1, padding: '13px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: sub.status === 'approved' ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: sub.status === 'approved' ? 'var(--text-sub)' : 'var(--accent)', fontFamily: 'inherit', opacity: sub.status === 'approved' ? 0.5 : 1 }}
          >
            {sub.status === 'approved' ? 'Disetujui ✓' : 'Setujui'}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '13px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'inherit' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function EditSheet({ sub, allWadah, onClose, onSave, isPending }: {
  sub: SubmissionItem
  allWadah: { id: string; name: string }[]
  onClose: () => void
  onSave: (persepuluhan: number, bulan: number, wadahEntries: { divisionId: string; amount: number }[]) => void
  isPending: boolean
}) {
  const [persepuluhan, setPersepuluhan] = useState(String(sub.persepuluhan))
  const [bulan, setBulan] = useState(String(sub.bulan))
  const [wadah, setWadah] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const w of sub.wadahEntries) init[w.divisionId] = String(w.amount)
    return init
  })
  const submittingRef = useRef(false)
  const [showWarning, setShowWarning] = useState(false)
  const alertedRef = useRef(false)

  function handleFocus() {
    if (!alertedRef.current) { alertedRef.current = true; setShowWarning(true) }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    submittingRef.current = true
    const entries = allWadah
      .map(d => ({ divisionId: d.id, amount: parseInt(wadah[d.id] || '0') || 0 }))
      .filter(w => w.amount > 0)
    onSave(parseInt(persepuluhan) || 0, parseInt(bulan) || 1, entries)
  }

  return (
    <>
      {showWarning && (
        <AlertModal
          message="Diharapkan menghubungi pendeta untuk memastikan nilai sebelum mengedit."
          onClose={() => setShowWarning(false)}
        />
      )}
      <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="sheet">
          <div className="sheet-handle" />
          <div className="sheet-title">Edit — {sub.pastorName}</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Persepuluhan</label>
              <RupiahInput value={persepuluhan} onChange={setPersepuluhan} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label className="form-label">Untuk berapa bulan</label>
              <input className="form-input" type="number" min={1} value={bulan} onChange={e => setBulan(e.target.value)} onFocus={handleFocus} style={{ maxWidth: 120 }} />
            </div>
            {allWadah.length > 0 && (
              <div className="form-group">
                <label className="form-label">Wadah (opsional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allWadah.map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-sub)', minWidth: 80 }}>{d.name}</span>
                      <RupiahInput value={wadah[d.id] ?? ''} onChange={v => setWadah(prev => ({ ...prev, [d.id]: v }))} onFocus={handleFocus} className="form-input" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

function ManualSubmitSheet({ availablePastors, allDivisions, onClose, onSave, isPending }: {
  availablePastors: AvailablePastorItem[]
  allDivisions: { id: string; name: string }[]
  onClose: () => void
  onSave: (pastorId: string, persepuluhan: number, bulan: number, wadahEntries: { divisionId: string; amount: number }[]) => Promise<string | null>
  isPending: boolean
}) {
  const [search, setSearch] = useState('')
  const [selectedPastorId, setSelectedPastorId] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [persepuluhan, setPersepuluhan] = useState('')
  const [bulan, setBulan] = useState('1')
  const [wadah, setWadah] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const submittingRef = useRef(false)

  const selectedPastor = availablePastors.find(p => p.id === selectedPastorId)

  const filtered = search
    ? availablePastors.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : availablePastors

  function handleSelectPastor(p: AvailablePastorItem) {
    setSelectedPastorId(p.id)
    setSearch(p.name)
    setDropdownOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending || !selectedPastorId) return
    submittingRef.current = true
    setError('')
    const entries = allDivisions
      .map(d => ({ divisionId: d.id, amount: parseInt(wadah[d.id] || '0') || 0 }))
    const err = await onSave(selectedPastorId, parseInt(persepuluhan) || 0, parseInt(bulan) || 1, entries)
    if (err) { setError(err); submittingRef.current = false }
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="sheet-title" style={{ margin: 0 }}>Tambah Data Manual</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 30, color: 'var(--red)', lineHeight: 1, fontFamily: 'inherit' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Nama Pendeta</label>
            <input
              className="form-input"
              placeholder="Cari pendeta..."
              value={search}
              onChange={e => { setSearch(e.target.value); setDropdownOpen(true); setSelectedPastorId('') }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              autoComplete="off"
            />
            {dropdownOpen && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, zIndex: 10, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {filtered.map(p => (
                  <div
                    key={p.id}
                    onMouseDown={() => handleSelectPastor(p)}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}
                  >
                    <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                    <span className={`badge pastor-title-${p.title}`} style={{ fontSize: 11 }}>{TITLE_LABEL[p.title] ?? p.title.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPastor?.pelayanan && (
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: -8 }}>{selectedPastor.pelayanan}</div>
          )}

          <div className="form-group">
            <label className="form-label">Persepuluhan</label>
            <RupiahInput value={persepuluhan} onChange={setPersepuluhan} />
          </div>
          <div className="form-group">
            <label className="form-label">Untuk berapa bulan</label>
            <input className="form-input" type="number" min={1} value={bulan} onChange={e => setBulan(e.target.value)} style={{ maxWidth: 120 }} />
          </div>
          {allDivisions.length > 0 && (
            <div className="form-group">
              <label className="form-label">Wadah (opsional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allDivisions.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-sub)', minWidth: 80 }}>{d.name}</span>
                    <RupiahInput value={wadah[d.id] ?? ''} onChange={v => setWadah(prev => ({ ...prev, [d.id]: v }))} className="form-input" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
          <button type="submit" className="submit-btn" disabled={isPending || !selectedPastorId} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  )
}

interface Props { meeting: MeetingDetailData }

export default function MeetingDetailClient({ meeting }: Props) {
  const [viewSub, setViewSub] = useState<SubmissionItem | null>(null)
  const [editSub, setEditSub] = useState<SubmissionItem | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmApproveAll, setConfirmApproveAll] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const pendingIds = meeting.submissions.filter(s => s.status === 'pending').map(s => s.id)
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every(id => selected.has(id))

  function toggleAll() {
    setSelected(allPendingSelected ? new Set() : new Set(pendingIds))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allWadahIds = [...new Set(meeting.submissions.flatMap(s => s.wadahEntries.map(w => w.divisionId)))]
  const allWadahMap = new Map<string, string>()
  for (const s of meeting.submissions) {
    for (const w of s.wadahEntries) allWadahMap.set(w.divisionId, w.divisionName)
  }
  const allWadah = allWadahIds.map(id => ({ id, name: allWadahMap.get(id) ?? id }))

  function handleApprove(sub: SubmissionItem) {
    startTransition(async () => {
      await approveSubmission(sub.id)
      setViewSub(null)
    })
  }

  function handleApproveSelected() {
    const ids = [...selected].filter(id => {
      const sub = meeting.submissions.find(s => s.id === id)
      return sub?.status === 'pending'
    })
    if (ids.length === 0) return
    startTransition(async () => {
      for (const id of ids) await approveSubmission(id)
      setSelected(new Set())
    })
  }

  function handleEdit(persepuluhan: number, bulan: number, wadahEntries: { divisionId: string; amount: number }[]) {
    if (!editSub) return
    startTransition(async () => {
      await editSubmission(editSub.id, { persepuluhan, bulan, wadahEntries })
      setEditSub(null)
    })
  }

  function handleClose() {
    startTransition(async () => { await closeMeeting(meeting.id) })
  }

  async function handleManualSave(pastorId: string, persepuluhan: number, bulan: number, wadahEntries: { divisionId: string; amount: number }[]): Promise<string | null> {
    return new Promise(resolve => {
      startTransition(async () => {
        const result = await adminAddSubmission({ meetingId: meeting.id, pastorId, persepuluhan, bulan, wadahEntries })
        if (result.ok) { setShowManual(false); resolve(null) }
        else resolve(result.error ?? 'Terjadi kesalahan.')
      })
    })
  }

  return (
    <div className="screen">
      <div className="topnav">
        <Link href="/pertemuan" className="back-btn">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topnav-title">
            {MONTHS_ID[parseInt(meeting.month.split('-')[1]) - 1]} {meeting.month.split('-')[0]}
          </div>
          <div className="topnav-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`badge ${meeting.status === 'open' ? 'meeting-open' : 'meeting-closed'}`} style={{ fontSize: 11 }}>
              {meeting.status === 'open' ? 'Aktif' : 'Tutup'}
            </span>
            {meeting.submissions.length} / {meeting.allPastorCount} pendeta
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {selected.size > 0 && (
            <button
              onClick={() => setConfirmApproveAll(true)}
              disabled={isPending}
              style={{ fontSize: 12, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer', padding: '6px 10px', fontWeight: 600, borderRadius: 8 }}
            >
              {isPending ? '...' : `Setujui ${selected.size}`}
            </button>
          )}
          <button onClick={() => setShowExportModal(true)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontWeight: 600 }}>XLSX</button>
          {meeting.status === 'open' && (
            <button onClick={handleClose} disabled={isPending} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontWeight: 600 }}>
              Tutup
            </button>
          )}
        </div>
      </div>

      <div className="content">
        {meeting.setorDate && (
          <div className="card" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: meeting.setorItems.length > 0 ? 10 : 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' }}>SETOR KAS MD</span>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                {fmtDate(meeting.setorDate)}
              </span>
            </div>
            {meeting.setorItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {meeting.setorItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{item.desc}</span>
                    <span style={{ fontSize: 12, color: 'var(--red)', whiteSpace: 'nowrap', flexShrink: 0 }}>− {fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: meeting.setorItems.length > 0 ? '1px solid var(--border)' : undefined, paddingTop: meeting.setorItems.length > 0 ? 10 : 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Net Setor</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmt(meeting.setorNetAmount ?? 0)}</span>
            </div>
          </div>
        )}

        {meeting.submissions.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-text">Belum ada pengisian</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      disabled={pendingIds.length === 0}
                      onChange={toggleAll}
                      style={{ cursor: pendingIds.length > 0 ? 'pointer' : 'default', width: 15, height: 15 }}
                    />
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>NAMA</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {meeting.submissions.map((sub, i) => (
                  <tr key={sub.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, opacity: isPending && selected.has(sub.id) ? 0.5 : 1 }}>
                    <td style={{ padding: '12px 12px', width: 36 }}>
                      {sub.status === 'pending' ? (
                        <input
                          type="checkbox"
                          checked={selected.has(sub.id)}
                          onChange={() => toggleOne(sub.id)}
                          style={{ cursor: 'pointer', width: 15, height: 15 }}
                        />
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--accent)' }}>✓</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 500 }}>{sub.pastorName}</span>
                      {' '}
                      <span className={`badge pastor-title-${sub.pastorTitle}`} style={{ fontSize: 11 }}>{TITLE_LABEL[sub.pastorTitle] ?? sub.pastorTitle.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setViewSub(sub)}
                        style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      {viewSub && (
        <DetailModal
          sub={viewSub}
          allWadah={allWadah}
          onClose={() => setViewSub(null)}
          onEdit={() => { setEditSub(viewSub); setViewSub(null) }}
          onApprove={() => handleApprove(viewSub)}
          isPending={isPending}
        />
      )}
      {editSub && (
        <EditSheet
          sub={editSub}
          allWadah={allWadah}
          onClose={() => setEditSub(null)}
          onSave={handleEdit}
          isPending={isPending}
        />
      )}
      {showManual && (
        <ManualSubmitSheet
          availablePastors={meeting.availablePastors}
          allDivisions={meeting.allDivisions}
          onClose={() => setShowManual(false)}
          onSave={handleManualSave}
          isPending={isPending}
        />
      )}
      {confirmApproveAll && (
        <AlertModal
          message={`Setujui ${selected.size} submission sekaligus?`}
          confirmLabel="Ya, Setujui"
          onClose={() => setConfirmApproveAll(false)}
          onConfirm={() => { setConfirmApproveAll(false); handleApproveSelected() }}
        />
      )}
      <button
        onClick={() => setShowManual(true)}
        style={{ position: 'fixed', bottom: 28, right: 20, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 26, fontWeight: 300, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 100, lineHeight: 1 }}
        aria-label="Tambah data manual"
      >
        +
      </button>
      {showExportModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowExportModal(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 300, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Unduh Excel</div>
            </div>
            <a
              href={`/api/pertemuan/${meeting.id}/export?type=md`}
              onClick={() => setShowExportModal(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>Persepuluhan MD</span>
              <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>↓ .xlsx</span>
            </a>
            <a
              href={`/api/pertemuan/${meeting.id}/export?type=kesehatan`}
              onClick={() => setShowExportModal(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>Dana Kesejahteraan</span>
              <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>↓ .xlsx</span>
            </a>
            <a
              href={`/api/pertemuan/${meeting.id}/export?type=all`}
              onClick={() => setShowExportModal(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>Laporan Lengkap</span>
              <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>↓ .xlsx</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
