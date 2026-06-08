import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { fmt } from '@/lib/format'
import { getRecalculationPreview } from '@/lib/actions/recalculation'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const [{ done }, preview] = await Promise.all([
    searchParams,
    getRecalculationPreview(),
  ])
  const changedDivisions = preview.divisions.filter(d => d.difference !== 0)
  const hasChanges = preview.kasUmum.difference !== 0 || changedDivisions.length > 0

  return (
    <FormShell title="Recalculate Saldo" sub="Dari semua transaksi" back="/">
      {done === '1' && (
        <div className="card" style={{ padding: 14, background: 'var(--green-light)', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
          Saldo berhasil dihitung ulang.
        </div>
      )}

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Kas Umum</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Saldo sekarang</span>
          <span style={{ fontWeight: 600 }}>{fmt(preview.kasUmum.currentBalance)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Dari transaksi</span>
          <span style={{ fontWeight: 600 }}>{fmt(preview.kasUmum.calculatedBalance)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Selisih</span>
          <span style={{ fontWeight: 700, color: preview.kasUmum.difference === 0 ? 'var(--muted)' : 'var(--red)' }}>
            {fmt(preview.kasUmum.difference)}
          </span>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
          Komisi
        </div>
        {preview.divisions.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>Belum ada komisi.</div>
        ) : (
          preview.divisions.map((division, index) => (
            <div
              key={division.id}
              style={{
                padding: '12px 16px',
                borderTop: index > 0 ? '1px solid var(--border)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{division.name}</span>
                <span style={{ fontWeight: 700, color: division.difference === 0 ? 'var(--muted)' : 'var(--red)' }}>
                  {fmt(division.difference)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                <span>Sekarang {fmt(division.currentBalance)}</span>
                <span>Transaksi {fmt(division.calculatedBalance)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <form action="/admin/recalculation/run" method="post">
        <button type="submit" className="submit-btn" disabled={!hasChanges}>
          {hasChanges ? 'Recalculate Saldo' : 'Saldo Sudah Sesuai'}
        </button>
      </form>
    </FormShell>
  )
}
