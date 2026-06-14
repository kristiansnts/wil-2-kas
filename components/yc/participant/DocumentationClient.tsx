'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import { YC_DOCUMENTATION_DRIVE_URL } from '@/lib/yc/constants'

type UploadType = 'personal' | 'group'

type GalleryJob = {
  id: string
  status: string
  uploadType: string
  caption: string | null
  originalFilename: string | null
  mimeType: string | null
  fileSizeBytes: number | null
  mediaUrl: string | null
  reviewComment: string | null
  errorMessage: string | null
  uploadedAt: string
  reviewedAt: string | null
}

type PendingFile = {
  localId: string
  file: File
  caption: string
  uploadType: UploadType
}

type ActiveUpload = {
  jobId: string
  localId: string
  progress: number
  phase: 'uploading' | 'processing'
}

const STATUS_LABEL: Record<string, string> = {
  QUEUED: 'Antrian',
  UPLOADING: 'Sedang diupload',
  PENDING_REVIEW: 'Menunggu review panitia',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  FAILED: 'Gagal',
}

const STATUS_CLASS: Record<string, string> = {
  QUEUED: 'yc-job-status--queued',
  UPLOADING: 'yc-job-status--uploading',
  PENDING_REVIEW: 'yc-job-status--review',
  APPROVED: 'yc-job-status--approved',
  REJECTED: 'yc-job-status--rejected',
  FAILED: 'yc-job-status--failed',
}

const MAX_CONCURRENT = 2

function uploadJobWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
  onProcessing: () => void,
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
        if (percent >= 100) onProcessing()
      }
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as Record<string, unknown>
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, data })
      } catch {
        reject(new Error('Respons server tidak valid'))
      }
    }
    xhr.onerror = () => reject(new Error('Koneksi gagal'))
    xhr.send(form)
  })
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

export default function DocumentationClient({
  token,
  canUploadAsGroup,
  initialJobs,
}: {
  token: string
  canUploadAsGroup: boolean
  initialJobs: GalleryJob[]
}) {
  const [jobs, setJobs] = useState<GalleryJob[]>(initialJobs)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [caption, setCaption] = useState('')
  const [uploadType, setUploadType] = useState<UploadType>('personal')
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([])
  const [queueRunning, setQueueRunning] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  const pendingRef = useRef(pendingFiles)
  const runningRef = useRef(false)

  pendingRef.current = pendingFiles

  const refreshJobs = useCallback(async () => {
    try {
      const res = await fetch(`/yc/api/p/${token}/documentation/jobs`)
      if (!res.ok) return
      const data = await res.json()
      setJobs(data.jobs as GalleryJob[])
    } catch {
      // ignore poll errors
    }
  }, [token])

  useEffect(() => {
    const id = setInterval(refreshJobs, 5000)
    return () => clearInterval(id)
  }, [refreshJobs])

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    const added: PendingFile[] = Array.from(fileList).map(file => ({
      localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      caption,
      uploadType,
    }))
    setPendingFiles(prev => [...prev, ...added])
  }

  function removePending(localId: string) {
    setPendingFiles(prev => prev.filter(p => p.localId !== localId))
  }

  async function cancelJob(jobId: string) {
    try {
      await fetch(`/yc/api/p/${token}/documentation/jobs/${jobId}`, { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch {
      setAlert('Gagal membatalkan job')
    }
  }

  const processQueue = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setQueueRunning(true)

    async function uploadOne(item: PendingFile) {
      const createRes = await fetch(`/yc/api/p/${token}/documentation/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            caption: item.caption,
            uploadType: item.uploadType,
            filename: item.file.name,
            mimeType: item.file.type || 'application/octet-stream',
            sizeBytes: item.file.size,
          }],
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(String(createData.error || 'Gagal membuat job'))

      const job = (createData.jobs as GalleryJob[])[0]
      setJobs(prev => [job, ...prev.filter(j => j.id !== job.id)])

      setActiveUploads(prev => [...prev, {
        jobId: job.id,
        localId: item.localId,
        progress: 0,
        phase: 'uploading',
      }])

      const { ok, data } = await uploadJobWithProgress(
        `/yc/api/p/${token}/documentation/jobs/${job.id}/upload`,
        item.file,
        percent => {
          setActiveUploads(prev => prev.map(a =>
            a.jobId === job.id ? { ...a, progress: percent } : a,
          ))
        },
        () => {
          setActiveUploads(prev => prev.map(a =>
            a.jobId === job.id ? { ...a, phase: 'processing' } : a,
          ))
        },
      )

      if (!ok) throw new Error(String(data.error || 'Upload gagal'))

      const completed = data.job as GalleryJob
      setJobs(prev => prev.map(j => j.id === job.id ? completed : j))
      setActiveUploads(prev => prev.filter(a => a.localId !== item.localId))
    }

    async function worker() {
      while (true) {
        const item = pendingRef.current.shift()
        if (!item) break
        setPendingFiles([...pendingRef.current])
        try {
          await uploadOne(item)
        } catch (err) {
          setAlert(err instanceof Error ? err.message : 'Upload gagal')
          setActiveUploads(prev => prev.filter(a => a.localId !== item.localId))
        }
      }
    }

    const workerCount = Math.min(MAX_CONCURRENT, Math.max(pendingRef.current.length, 1))
    await Promise.all(Array.from({ length: workerCount }, () => worker()))

    runningRef.current = false
    setQueueRunning(false)
    await refreshJobs()
  }, [token, refreshJobs])

  async function startUpload() {
    if (pendingFiles.length === 0) {
      setAlert('Pilih file dulu')
      return
    }
    void processQueue()
  }

  const isBusy = queueRunning || activeUploads.length > 0

  function renderJobRow(job: GalleryJob) {
    const active = activeUploads.find(a => a.jobId === job.id)
    const label = STATUS_LABEL[job.status] ?? job.status
    const statusClass = STATUS_CLASS[job.status] ?? ''

    return (
      <div key={job.id} className="yc-job-card">
        <div className="yc-job-card-header">
          <div className="yc-job-filename">{job.originalFilename ?? 'File'}</div>
          <span className={`yc-job-status ${statusClass}`}>{label}</span>
        </div>
        <div className="yc-job-meta">
          {job.uploadType === 'group' ? 'Kelompok' : 'Personal'}
          {job.fileSizeBytes ? ` · ${formatSize(job.fileSizeBytes)}` : ''}
          {job.caption ? ` · ${job.caption}` : ''}
        </div>

        {active && (
          <div className="yc-upload-progress" style={{ marginTop: 10 }}>
            <div className="yc-upload-progress-label">
              <span>{active.phase === 'processing' ? 'Memproses di server…' : 'Mengupload…'}</span>
              {active.phase === 'uploading' && <span>{active.progress}%</span>}
            </div>
            <div className={`yc-upload-progress-track${active.phase === 'processing' ? ' yc-upload-progress-track--indeterminate' : ''}`}>
              <div
                className="yc-upload-progress-fill"
                style={{ width: active.phase === 'processing' ? undefined : `${active.progress}%` }}
              />
            </div>
          </div>
        )}

        {job.status === 'REJECTED' && job.reviewComment && (
          <div className="yc-job-reject-comment">Alasan: {job.reviewComment}</div>
        )}
        {job.status === 'FAILED' && job.errorMessage && (
          <div className="yc-job-reject-comment">{job.errorMessage}</div>
        )}

        <div className="yc-job-actions">
          {job.mediaUrl && job.status !== 'FAILED' && job.status !== 'QUEUED' && (
            <a href={job.mediaUrl} target="_blank" rel="noopener noreferrer" className="yc-job-link">
              Lihat media
            </a>
          )}
          {(job.status === 'QUEUED' || job.status === 'FAILED') && !active && (
            <button type="button" className="yc-job-cancel" onClick={() => cancelJob(job.id)}>
              Hapus
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <FormShell title="Dokumentasi" sub="Tukang Ngonten · 50 poin per upload (setelah disetujui panitia)" back={`/yc/p/${token}`}>
      <div className="card" style={{ padding: 14, fontSize: 13, lineHeight: 1.5 }}>
        Upload sebagai <strong>Personal</strong> → poin masuk ke kamu setelah disetujui panitia.
        {canUploadAsGroup ? (
          <> Upload sebagai <strong>Kelompok</strong> → poin masuk ke kelompokmu (kamu content creator).</>
        ) : (
          <> Hanya <strong>content creator</strong> kelompok yang bisa upload sebagai kelompok.</>
        )}
        {' '}Bisa pilih beberapa file sekaligus — upload berjalan di background.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Foto / Video (bisa banyak)</label>
          <input
            className="form-input"
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={isBusy}
            onChange={e => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Caption (untuk file baru)</label>
          <input
            className="form-input"
            value={caption}
            disabled={isBusy}
            onChange={e => setCaption(e.target.value)}
            placeholder="Opsional — dipakai untuk file yang akan ditambahkan"
          />
        </div>
        {canUploadAsGroup && (
          <div className="form-group">
            <label className="form-label">Upload sebagai</label>
            <div className="seg-control">
              <button type="button" className={`seg-btn${uploadType === 'personal' ? ' active' : ''}`} disabled={isBusy} onClick={() => setUploadType('personal')}>Personal</button>
              <button type="button" className={`seg-btn${uploadType === 'group' ? ' active' : ''}`} disabled={isBusy} onClick={() => setUploadType('group')}>Kelompok</button>
            </div>
          </div>
        )}

        {pendingFiles.length > 0 && (
          <div>
            <div className="section-header" style={{ marginTop: 0 }}>
              <div className="section-title">Siap diupload ({pendingFiles.length})</div>
            </div>
            {pendingFiles.map(p => (
              <div key={p.localId} className="yc-job-card yc-job-card--pending">
                <div className="yc-job-card-header">
                  <div className="yc-job-filename">{p.file.name}</div>
                  <span className="yc-job-status yc-job-status--queued">Antrian lokal</span>
                </div>
                <div className="yc-job-meta">
                  {p.uploadType === 'group' ? 'Kelompok' : 'Personal'} · {formatSize(p.file.size)}
                  {p.caption ? ` · ${p.caption}` : ''}
                </div>
                {!isBusy && (
                  <button type="button" className="yc-job-cancel" style={{ marginTop: 8 }} onClick={() => removePending(p.localId)}>
                    Hapus
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="submit-btn" disabled={isBusy} onClick={startUpload} style={{ marginTop: 12 }}>
              {isBusy ? `Mengupload… (${activeUploads.length} aktif)` : `Upload ${pendingFiles.length} file`}
            </button>
          </div>
        )}

        <div className="section-header">
          <div className="section-title">Riwayat upload</div>
        </div>
        {jobs.length === 0 ? (
          <div className="empty"><div className="empty-text">Belum ada upload</div></div>
        ) : (
          jobs.map(renderJobRow)
        )}
      </div>

      <a
        href={YC_DOCUMENTATION_DRIVE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="submit-btn"
        style={{
          background: 'var(--bg)',
          color: 'var(--accent)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          textDecoration: 'none',
          marginTop: 16,
        }}
      >
        Lihat semua dokumentasi
      </a>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
