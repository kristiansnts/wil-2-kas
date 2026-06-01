import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { addSetorMDForm } from '@/lib/actions/kas'
import { fmt, fmtYM, todayStr } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

const ROWS = 8

export default async function Page({ params }: { params: Promise<{ meetingId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { meetingId } = await params
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      submissions: { where: { status: 'approved' }, select: { persepuluhan: true } },
      setorItems: { orderBy: { id: 'asc' } },
    },
  })
  if (!meeting) notFound()

  const totalPersepuluhan = meeting.submissions.reduce((s, x) => s + x.persepuluhan, 0)
  const amount85 = Math.round(totalPersepuluhan * 0.85)
  const items = meeting.setorItems
  const defaultDate = meeting.setorDate ? meeting.setorDate.toISOString().slice(0, 10) : todayStr()

  return (
    <FormShell title="Setor MD" sub={fmtYM(meeting.month)} back="/kas/setor-md">
      <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Total persepuluhan</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(totalPersepuluhan)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>85% alokasi MD</span>
          <span style={{ fontSize: 13 }}>{fmt(amount85)}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          Net Setor = 85% − total bantuan (dihitung otomatis saat disimpan).
        </div>
      </div>

      <form action={addSetorMDForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="meetingId" value={meeting.id} />
        <div className="form-group">
          <label className="form-label">Pengurang / Bantuan (opsional)</label>
          {Array.from({ length: ROWS }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="form-input" type="text" name={`desc${i}`} placeholder="Keterangan" defaultValue={items[i]?.desc ?? ''} style={{ flex: 2, minWidth: 0 }} />
              <input className="form-input" type="text" inputMode="numeric" name={`amount${i}`} data-rupiah="" placeholder="Rp 0" defaultValue={items[i] ? String(items[i].amount) : ''} style={{ flex: 1, minWidth: 0 }} />
            </div>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input className="form-input" type="date" name="date" defaultValue={defaultDate} required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>
          {meeting.setorDate ? 'Simpan Perubahan' : 'Catat Setor MD'}
        </button>
      </form>
    </FormShell>
  )
}
