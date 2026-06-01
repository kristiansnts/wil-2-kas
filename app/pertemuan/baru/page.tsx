import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createMeetingForm } from '@/lib/actions/meeting'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  return (
    <FormShell title="Buat Pertemuan Baru" back="/pertemuan">
      <form action={createMeetingForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Bulan</label>
          <input className="form-input" type="month" name="month" required />
        </div>
        <div className="form-group">
          <label className="form-label">Batas Pengisian</label>
          <input className="form-input" type="datetime-local" name="deadline" required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Buat Pertemuan</button>
      </form>
    </FormShell>
  )
}
