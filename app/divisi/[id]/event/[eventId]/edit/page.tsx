import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { updateEventForm } from '@/lib/actions/divisi'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id, eventId } = await params
  const ev = await prisma.event.findUnique({ where: { id: eventId } })
  if (!ev || ev.divisionId !== id) notFound()

  return (
    <FormShell title="Edit Event" back={`/divisi/${id}/event`}>
      <form action={updateEventForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="id" value={ev.id} />
        <input type="hidden" name="divisionId" value={id} />
        <div className="form-group">
          <label className="form-label">Nama Event</label>
          <input className="form-input" type="text" name="name" required defaultValue={ev.name} />
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal Event</label>
          <input className="form-input" type="date" name="date" defaultValue={ev.date.toISOString().slice(0, 10)} required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Simpan Perubahan</button>
      </form>

      <Link
        href={`/divisi/${id}/event/${ev.id}/hapus`}
        style={{ display: 'block', textAlign: 'center', marginTop: 16, padding: 12, borderRadius: 12, border: '1px solid var(--border)', color: 'var(--red)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
      >
        Hapus Event
      </Link>
    </FormShell>
  )
}
