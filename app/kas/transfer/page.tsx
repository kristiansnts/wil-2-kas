import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { addTxnUmumForm } from '@/lib/actions/kas'
import { todayStr } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const divisions = await prisma.division.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <FormShell title="Transfer ke Komisi" back="/">
      {divisions.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada komisi.</div>
      ) : (
        <form action={addTxnUmumForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="isTransfer" value="1" />
          <div className="form-group">
            <label className="form-label">Komisi Tujuan</label>
            <select className="form-select" name="refDivId" required>
              {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah</label>
            <input className="form-input" type="text" inputMode="numeric" name="amount" data-rupiah="" required placeholder="Rp 0" />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input className="form-input" type="date" name="date" defaultValue={todayStr()} required />
          </div>
          <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Transfer</button>
        </form>
      )}
    </FormShell>
  )
}
