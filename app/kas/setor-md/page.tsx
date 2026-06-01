import Link from 'next/link'
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
    select: { id: true, month: true, setorDate: true },
  })

  return (
    <FormShell title="Setor MD" sub="Pilih pertemuan" back="/">
      {meetings.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada pertemuan yang tercatat.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {meetings.map(m => (
            <Link
              key={m.id}
              href={`/kas/setor-md/${m.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{fmtYM(m.month)}</span>
              <span style={{ fontSize: 12, color: m.setorDate ? 'var(--green)' : 'var(--muted)' }}>
                {m.setorDate ? '✓ sudah disetor' : 'belum'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </FormShell>
  )
}
