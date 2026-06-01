import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { updateTxnUmumForm } from '@/lib/actions/kas'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id } = await params
  const txn = await prisma.transaction.findUnique({ where: { id } })
  if (!txn || txn.scope !== 'umum') notFound()

  return (
    <FormShell title="Edit Transaksi" back="/">
      <form action={updateTxnUmumForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="id" value={txn.id} />
        <div className="form-group">
          <label className="form-label">Tipe</label>
          <select className="form-select" name="type" defaultValue={txn.type}>
            <option value="masuk">Pemasukan</option>
            <option value="keluar">Pengeluaran</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Jumlah</label>
          <input className="form-input" type="text" inputMode="numeric" name="amount" data-rupiah="" required defaultValue={String(txn.amount)} placeholder="Rp 0" />
        </div>
        <div className="form-group">
          <label className="form-label">Keterangan</label>
          <input className="form-input" type="text" name="desc" required defaultValue={txn.desc} />
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input className="form-input" type="date" name="date" defaultValue={txn.date.toISOString().slice(0, 10)} required />
        </div>
        <button type="submit" className="submit-btn" style={{ marginTop: 4 }}>Simpan Perubahan</button>
      </form>

      <Link
        href={`/kas/transaksi/${txn.id}/hapus`}
        style={{ display: 'block', textAlign: 'center', marginTop: 16, padding: 12, borderRadius: 12, border: '1px solid var(--border)', color: 'var(--red)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
      >
        Hapus Transaksi
      </Link>
    </FormShell>
  )
}
