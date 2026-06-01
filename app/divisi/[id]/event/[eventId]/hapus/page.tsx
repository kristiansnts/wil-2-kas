import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { deleteEventForm } from '@/lib/actions/divisi'
import { fmtDate } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id, eventId } = await params
  const ev = await prisma.event.findUnique({ where: { id: eventId } })
  if (!ev || ev.divisionId !== id) notFound()

  return (
    <FormShell title="Hapus Event" back={`/divisi/${id}/event`}>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{ev.name}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{fmtDate(ev.date.toISOString())}</div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 16 }}>
        Yakin ingin menghapus event ini? Transaksi terkait akan menjadi tanpa event (tidak dihapus).
      </div>
      <form action={deleteEventForm}>
        <input type="hidden" name="id" value={ev.id} />
        <input type="hidden" name="divisionId" value={id} />
        <button type="submit" className="submit-btn" style={{ background: 'var(--red)' }}>Ya, Hapus</button>
      </form>
      <Link href={`/divisi/${id}/event`} style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: 12, color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>
        Batal
      </Link>
    </FormShell>
  )
}
