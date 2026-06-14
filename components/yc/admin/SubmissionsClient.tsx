'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import { approveSubmission, rejectSubmission } from '@/lib/yc/actions/submissions'
import { approveGallerySubmission, rejectGallerySubmission } from '@/lib/yc/actions/gallery'

type Sub = {
  id: string
  answerText: string | null
  mediaUrl: string | null
  status: string
  submittedAt: string
  participantName: string | null
  challengeTitle: string
  groupName: string | null
}

type GalleryItem = {
  id: string
  caption: string | null
  mediaUrl: string | null
  originalFilename: string | null
  uploadType: string
  uploadedAt: string
  participantName: string | null
  groupName: string | null
}

export default function SubmissionsClient({
  submissions,
  galleryPending,
  formSubmissionCount,
}: {
  submissions: Sub[]
  galleryPending: GalleryItem[]
  formSubmissionCount: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  async function act(id: string, action: 'approve' | 'reject') {
    setLoading(id)
    try {
      const fn = action === 'approve' ? approveSubmission : rejectSubmission
      const res = await fn(id)
      if (res && 'error' in res) setAlert(res.error!)
      else router.refresh()
    } catch {
      setAlert('Gagal')
    } finally {
      setLoading(null)
    }
  }

  async function actGallery(id: string, action: 'approve' | 'reject') {
    if (action === 'reject') {
      setRejectTarget(id)
      setRejectComment('')
      return
    }
    setLoading(id)
    try {
      const res = await approveGallerySubmission(id)
      if (res && 'error' in res) setAlert(res.error!)
      else router.refresh()
    } catch {
      setAlert('Gagal')
    } finally {
      setLoading(null)
    }
  }

  async function confirmGalleryReject() {
    if (!rejectTarget) return
    const comment = rejectComment.trim()
    if (!comment) {
      setAlert('Komentar penolakan wajib diisi')
      return
    }
    setLoading(rejectTarget)
    try {
      const res = await rejectGallerySubmission(rejectTarget, comment)
      if (res && 'error' in res) setAlert(res.error!)
      else {
        setRejectTarget(null)
        setRejectComment('')
        router.refresh()
      }
    } catch {
      setAlert('Gagal')
    } finally {
      setLoading(null)
    }
  }

  return (
    <FormShell title="Submissions" back="/yc/admin">
      <div className="section-header" style={{ marginTop: 0 }}>
        <div className="section-title">
          Dokumentasi (Pending Review)
          {galleryPending.length > 0 && (
            <span className="yc-admin-table-count">{galleryPending.length}</span>
          )}
        </div>
      </div>
      {galleryPending.length === 0 ? (
        <div className="empty"><div className="empty-text">Tidak ada dokumentasi pending</div></div>
      ) : (
        <div className="card yc-admin-table-wrap">
          <table className="yc-admin-table">
            <thead>
              <tr>
                <th>Peserta</th>
                <th>Tipe</th>
                <th>Media</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {galleryPending.map(g => (
                <tr key={g.id}>
                  <td>{g.participantName ?? '—'}</td>
                  <td>{g.uploadType === 'group' ? 'Kelompok' : 'Personal'}</td>
                  <td>
                    {g.mediaUrl ? (
                      <Link href={g.mediaUrl} target="_blank" className="yc-admin-table-link">
                        Lihat
                      </Link>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="yc-admin-table-actions">
                      <button
                        type="button"
                        className="yc-admin-table-btn yc-admin-table-btn--approve"
                        disabled={loading === g.id}
                        onClick={() => actGallery(g.id, 'approve')}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="yc-admin-table-btn yc-admin-table-btn--reject"
                        disabled={loading === g.id}
                        onClick={() => actGallery(g.id, 'reject')}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-header">
        <div className="section-title">Challenge (Pending)</div>
      </div>
      {submissions.length === 0 ? (
        <div className="empty"><div className="empty-text">Tidak ada submission pending</div></div>
      ) : (
        submissions.map(s => (
          <div key={s.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{s.challengeTitle}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {s.participantName} {s.groupName ? `· ${s.groupName}` : ''}
            </div>
            {s.answerText && <div style={{ marginTop: 8, fontSize: 14 }}>{s.answerText}</div>}
            {s.mediaUrl && (
              <Link href={s.mediaUrl} target="_blank" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 6, display: 'block' }}>
                Lihat media
              </Link>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="submit-btn" style={{ flex: 1 }} disabled={loading === s.id} onClick={() => act(s.id, 'approve')}>Approve</button>
              <button className="submit-btn" style={{ flex: 1, background: 'var(--red)' }} disabled={loading === s.id} onClick={() => act(s.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))
      )}

      <div className="section-header">
        <div className="section-title">Form Worship Night</div>
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>Total sudah submit</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{formSubmissionCount}</div>
        <a
          href="/yc/api/admin/form-submissions/export"
          className="submit-btn"
          style={{ display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'none' }}
          download
        >
          Download TXT
        </a>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
          Semua jawaban anonim diekspor ke file teks untuk analisis AI.
        </div>
      </div>

      {rejectTarget && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setRejectTarget(null)}>
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-title">Tolak Upload</div>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Beri alasan penolakan — peserta akan melihat komentar ini.
            </p>
            <textarea
              className="form-input"
              rows={4}
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="Contoh: Foto tidak relevan dengan kegiatan YC"
              style={{ resize: 'vertical', minHeight: 96 }}
            />
            <button
              type="button"
              className="submit-btn"
              style={{ marginTop: 14, background: 'var(--red)' }}
              disabled={loading === rejectTarget}
              onClick={confirmGalleryReject}
            >
              {loading === rejectTarget ? 'Menyimpan…' : 'Tolak Upload'}
            </button>
          </div>
        </div>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
