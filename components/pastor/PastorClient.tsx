'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { addPastor, updatePastor, deletePastor } from '@/lib/actions/pastor'
import type { PastorItem, PastorTitle, PastorStatus } from '@/lib/types'

interface Props { pastors: PastorItem[] }

const TITLES: { value: PastorTitle; label: string }[] = [
  { value: 'pdp', label: 'PDP' },
  { value: 'pdm', label: 'PDM' },
  { value: 'pdt', label: 'PDT' },
]

const STATUSES: { value: PastorStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'on_hold', label: 'On Hold' },
]

function titleLabel(t: PastorTitle) { return TITLES.find(x => x.value === t)?.label ?? t.toUpperCase() }
function statusLabel(s: PastorStatus) { return STATUSES.find(x => x.value === s)?.label ?? s }

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function PastorForm({ initial, onClose, onSave, isPending }: {
  initial?: PastorItem
  onClose: () => void
  onSave: (payload: { name: string; title: PastorTitle; status: PastorStatus; pelayanan: string | null }) => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [title, setTitle] = useState<PastorTitle>(initial?.title ?? 'pdp')
  const [status, setStatus] = useState<PastorStatus>(initial?.status ?? 'active')
  const [pelayanan, setPelayanan] = useState(initial?.pelayanan ?? '')
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending || !name.trim()) return
    submittingRef.current = true
    onSave({ name: name.trim(), title, status, pelayanan: pelayanan.trim() || null })
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{initial ? 'Edit Pendeta' : 'Tambah Pendeta'}</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nama</label>
            <input
              className="form-input"
              type="text"
              placeholder="Nama lengkap pendeta"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <div className="seg-control">
              {TITLES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`seg-btn ${title === t.value ? 'active' : ''}`}
                  onClick={() => setTitle(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as PastorStatus)}>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tempat Pelayanan</label>
            <input
              className="form-input"
              type="text"
              placeholder="Nama gereja / wilayah pelayanan"
              value={pelayanan}
              onChange={e => setPelayanan(e.target.value)}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: 4 }}>
            {isPending ? 'Menyimpan...' : initial ? 'Simpan Perubahan' : 'Tambah Pendeta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PastorRow({ pastor, onEdit, onDelete, isPending }: {
  pastor: PastorItem
  onEdit: () => void
  onDelete: () => void
  isPending: boolean
}) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="pastor-row">
      <div className="div-avatar" style={{ flexShrink: 0 }}>{initials(pastor.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="div-name">{pastor.name}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge pastor-title-${pastor.title}`}>{titleLabel(pastor.title)}</span>
          <span className={`badge pastor-status-${pastor.status}`}>{statusLabel(pastor.status)}</span>
          {pastor.pelayanan && <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{pastor.pelayanan}</span>}
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
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={onEdit}
            disabled={isPending}
            style={{ width: 34, height: 34, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'white' }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => setConfirm(true)}
            disabled={isPending}
            style={{ width: 34, height: 34, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--red)', color: 'white' }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 10

export default function PastorClient({ pastors }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editPastor, setEditPastor] = useState<PastorItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(pastors.length / PAGE_SIZE)
  const paginated = pastors.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  function handleAdd(payload: { name: string; title: PastorTitle; status: PastorStatus; pelayanan: string | null }) {
    startTransition(async () => {
      await addPastor(payload)
      setShowAdd(false)
      setPage(0)
    })
  }

  function handleUpdate(payload: { name: string; title: PastorTitle; status: PastorStatus; pelayanan: string | null }) {
    if (!editPastor) return
    startTransition(async () => {
      await updatePastor(editPastor.id, payload)
      setEditPastor(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePastor(id)
      setPage(p => {
        const newTotal = Math.ceil((pastors.length - 1) / PAGE_SIZE)
        return p >= newTotal ? Math.max(0, newTotal - 1) : p
      })
    })
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
          <div className="topnav-title">Daftar Pendeta</div>
          <div className="topnav-sub">{pastors.length} pendeta terdaftar</div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontWeight: 600 }}
        >
          + Tambah
        </button>
      </div>

      <div className="content">
        <div className="card">
          {pastors.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">👤</div>
              <div className="empty-text">Belum ada pendeta terdaftar</div>
            </div>
          ) : (
            paginated.map(p => (
              <PastorRow
                key={p.id}
                pastor={p}
                onEdit={() => setEditPastor(p)}
                onDelete={() => handleDelete(p.id)}
                isPending={isPending}
              />
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 0' }}>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              style={{ width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages - 1}
              style={{ width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      {showAdd && (
        <PastorForm onClose={() => setShowAdd(false)} onSave={handleAdd} isPending={isPending} />
      )}
      {editPastor && (
        <PastorForm initial={editPastor} onClose={() => setEditPastor(null)} onSave={handleUpdate} isPending={isPending} />
      )}
    </div>
  )
}
