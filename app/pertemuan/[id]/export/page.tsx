import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { FormShell } from '@/components/forms/FormShell'

const OPTIONS = [
  { type: 'md', label: 'Persepuluhan MD' },
  { type: 'kesehatan', label: 'Dana Kesejahteraan' },
  { type: 'all', label: 'Laporan Lengkap' },
]

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id } = await params

  return (
    <FormShell title="Unduh Excel" back={`/pertemuan/${id}`}>
      <div className="card" style={{ padding: 0 }}>
        {OPTIONS.map(o => (
          <a
            key={o.type}
            href={`/api/pertemuan/${id}/export?type=${o.type}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</span>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>↓ .xlsx</span>
          </a>
        ))}
      </div>
    </FormShell>
  )
}
