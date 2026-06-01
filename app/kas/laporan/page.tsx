import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { fmtYM } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const meetings = await prisma.meeting.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, month: true },
  })

  return (
    <FormShell title="Laporan Bulanan" sub="Unduh Excel per bulan" back="/">
      {meetings.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada pertemuan yang tercatat.</div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            Tiap unduhan berisi 3 sheet: Laporan Lengkap, MD, dan Dana Kesejahteraan.
          </div>
          <div className="card" style={{ padding: 0 }}>
            {meetings.map(m => (
              <a
                key={m.id}
                href={`/api/laporan/export?meetingId=${m.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{fmtYM(m.month)}</span>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>⬇ Unduh Excel</span>
              </a>
            ))}
          </div>
        </>
      )}
    </FormShell>
  )
}
