import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMeetingDetail } from '@/lib/actions/meeting'
import { adminAddSubmissionForm } from '@/lib/actions/submission'
import { FormShell } from '@/components/forms/FormShell'

const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id } = await params
  const { error } = await searchParams
  const meeting = await getMeetingDetail(id)
  if (!meeting) notFound()

  return (
    <FormShell title="Tambah Data Manual" back={`/pertemuan/${id}`}>
      {error && (
        <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>
      )}
      {meeting.availablePastors.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Semua pendeta aktif sudah mengisi.</div>
      ) : (
        <form action={adminAddSubmissionForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="meetingId" value={meeting.id} />
          <div className="form-group">
            <label className="form-label">Nama Pendeta</label>
            <select className="form-select" name="pastorId" required defaultValue="">
              <option value="" disabled>Pilih pendeta...</option>
              {meeting.availablePastors.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({TITLE_LABEL[p.title] ?? p.title.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Persepuluhan</label>
            <input className="form-input" type="text" inputMode="numeric" name="persepuluhan" data-rupiah="" placeholder="Rp 0" />
          </div>
          <div className="form-group">
            <label className="form-label">Untuk berapa bulan</label>
            <input className="form-input" type="number" min={1} name="bulan" defaultValue="1" style={{ maxWidth: 120 }} />
          </div>
          {meeting.allDivisions.length > 0 && (
            <div className="form-group">
              <label className="form-label">Wadah (opsional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {meeting.allDivisions.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-sub)', minWidth: 80 }}>{d.name}</span>
                    <input className="form-input" type="text" inputMode="numeric" name={`wadah_${d.id}`} data-rupiah="" placeholder="Rp 0" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Simpan</button>
        </form>
      )}
    </FormShell>
  )
}
