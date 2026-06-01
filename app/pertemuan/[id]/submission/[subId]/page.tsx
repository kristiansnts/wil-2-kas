import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMeetingDetail } from '@/lib/actions/meeting'
import { approveSubmissionForm } from '@/lib/actions/submission'
import { fmt } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

export default async function Page({ params }: { params: Promise<{ id: string; subId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id, subId } = await params
  const meeting = await getMeetingDetail(id)
  const sub = meeting?.submissions.find(s => s.id === subId)
  if (!meeting || !sub) notFound()

  const approved = sub.status === 'approved'

  return (
    <FormShell title={sub.pastorName} sub={TITLE_LABEL[sub.pastorTitle] ?? sub.pastorTitle.toUpperCase()} back={`/pertemuan/${id}`}>
      {sub.pastorPelayanan && (
        <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>{sub.pastorPelayanan}</div>
      )}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Persepuluhan</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{fmt(sub.persepuluhan)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Untuk berapa bulan</span>
          <span className="badge">{sub.bulan} bulan</span>
        </div>
        {sub.wadahEntries.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
            {sub.wadahEntries.map(w => (
              <div key={w.divisionId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{w.divisionName}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(w.amount)}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {approved ? (
        <div className="submit-btn" style={{ background: 'var(--bg)', color: 'var(--text-sub)', textAlign: 'center', cursor: 'default' }}>
          Sudah Disetujui ✓
        </div>
      ) : (
        <form action={approveSubmissionForm}>
          <input type="hidden" name="submissionId" value={sub.id} />
          <input type="hidden" name="meetingId" value={meeting.id} />
          <button type="submit" className="submit-btn">Setujui</button>
        </form>
      )}

      <Link
        href={`/pertemuan/${id}/submission/${sub.id}/edit`}
        style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
      >
        Edit Data
      </Link>
    </FormShell>
  )
}
