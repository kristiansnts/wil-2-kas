import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMeetingDetail } from '@/lib/actions/meeting'
import { editSubmissionForm } from '@/lib/actions/submission'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string; subId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id, subId } = await params
  const meeting = await getMeetingDetail(id)
  const sub = meeting?.submissions.find(s => s.id === subId)
  if (!meeting || !sub) notFound()

  const wadahMap = new Map(sub.wadahEntries.map(w => [w.divisionId, w.amount]))

  return (
    <FormShell title={`Edit — ${sub.pastorName}`} back={`/pertemuan/${id}/submission/${sub.id}`}>
      <form action={editSubmissionForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="submissionId" value={sub.id} />
        <input type="hidden" name="meetingId" value={meeting.id} />
        <div className="form-group">
          <label className="form-label">Persepuluhan</label>
          <input className="form-input" type="text" inputMode="numeric" name="persepuluhan" data-rupiah="" defaultValue={String(sub.persepuluhan)} placeholder="Rp 0" />
        </div>
        <div className="form-group">
          <label className="form-label">Untuk berapa bulan</label>
          <input className="form-input" type="number" min={1} name="bulan" defaultValue={String(sub.bulan)} style={{ maxWidth: 120 }} />
        </div>
        {meeting.allDivisions.length > 0 && (
          <div className="form-group">
            <label className="form-label">Wadah (opsional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {meeting.allDivisions.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-sub)', minWidth: 80 }}>{d.name}</span>
                  <input className="form-input" type="text" inputMode="numeric" name={`wadah_${d.id}`} data-rupiah="" defaultValue={wadahMap.has(d.id) ? String(wadahMap.get(d.id)) : ''} placeholder="Rp 0" />
                </div>
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Simpan Perubahan</button>
      </form>
    </FormShell>
  )
}
