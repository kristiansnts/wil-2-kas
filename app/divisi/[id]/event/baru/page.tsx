import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { addEventForm } from '@/lib/actions/divisi'
import { todayStr } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const division = await prisma.division.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!division) notFound()

  return (
    <FormShell title="Buat Event Baru" sub={division.name} back={`/divisi/${id}/event`}>
      <form action={addEventForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="divisionId" value={division.id} />
        <div className="form-group">
          <label className="form-label">Nama Event</label>
          <input className="form-input" type="text" name="name" required placeholder="cth. Festival Budaya 2026" />
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal Event</label>
          <input className="form-input" type="date" name="date" defaultValue={todayStr()} required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Buat Event</button>
      </form>
    </FormShell>
  )
}
