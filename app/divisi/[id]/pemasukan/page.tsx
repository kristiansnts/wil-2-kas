import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { addTxnDivisiForm } from '@/lib/actions/divisi'
import { todayStr } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const division = await prisma.division.findUnique({
    where: { id },
    include: { events: { orderBy: { date: 'desc' } } },
  })
  if (!division) notFound()

  return (
    <FormShell title="Catat Pemasukan" sub={division.name} back={`/divisi/${id}`}>
      <form action={addTxnDivisiForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="divisionId" value={division.id} />
        <input type="hidden" name="type" value="masuk" />
        <div className="form-group">
          <label className="form-label">Jumlah</label>
          <input className="form-input" type="text" inputMode="numeric" name="amount" data-rupiah="" required placeholder="Rp 0" />
        </div>
        <div className="form-group">
          <label className="form-label">Keterangan</label>
          <input className="form-input" type="text" name="desc" required placeholder="Deskripsi transaksi..." />
        </div>
        <div className="form-group">
          <label className="form-label">Kategori / Event</label>
          <select className="form-select" name="eventId" defaultValue="">
            <option value="">Harian (umum)</option>
            {division.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input className="form-input" type="date" name="date" defaultValue={todayStr()} required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Simpan</button>
      </form>
    </FormShell>
  )
}
