import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { addTxnUmumForm } from '@/lib/actions/kas'
import { todayStr } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  return (
    <FormShell title="Catat Pemasukan" back="/">
      <form action={addTxnUmumForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="type" value="masuk" />
        <input type="hidden" name="isTransfer" value="0" />
        <div className="form-group">
          <label className="form-label">Jumlah</label>
          <input className="form-input" type="text" inputMode="numeric" name="amount" data-rupiah="" required placeholder="Rp 0" />
        </div>
        <div className="form-group">
          <label className="form-label">Keterangan</label>
          <input className="form-input" type="text" name="desc" required placeholder="cth. Sumbangan jemaat" />
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input className="form-input" type="date" name="date" defaultValue={todayStr()} required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Catat Pemasukan</button>
      </form>
    </FormShell>
  )
}
