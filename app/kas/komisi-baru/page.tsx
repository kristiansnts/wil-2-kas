import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { addDivisionForm } from '@/lib/actions/kas'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  return (
    <FormShell title="Buat Komisi Baru" back="/">
      <form action={addDivisionForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Nama Komisi</label>
          <input className="form-input" type="text" name="name" required placeholder="cth. Acara, Humas" />
        </div>
        <div className="form-group">
          <label className="form-label">Saldo Awal (opsional)</label>
          <input className="form-input" type="text" inputMode="numeric" name="initialBalance" data-rupiah="" placeholder="Rp 0" />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Buat Komisi</button>
      </form>
    </FormShell>
  )
}
