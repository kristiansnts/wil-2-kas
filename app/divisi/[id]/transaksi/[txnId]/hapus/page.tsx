import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { deleteTxnDivisiForm } from '@/lib/actions/divisi'
import { fmt, fmtDate } from '@/lib/format'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string; txnId: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id, txnId } = await params
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
  if (!txn || txn.divisionId !== id) notFound()

  return (
    <FormShell title="Hapus Transaksi" back={`/divisi/${id}`}>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{txn.desc}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {fmtDate(txn.date.toISOString())} · {txn.type === 'masuk' ? '+' : '−'}{fmt(txn.amount)}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 16 }}>
        Yakin ingin menghapus transaksi ini? Saldo komisi akan disesuaikan otomatis.
      </div>
      <form action={deleteTxnDivisiForm}>
        <input type="hidden" name="id" value={txn.id} />
        <input type="hidden" name="divisionId" value={id} />
        <button type="submit" className="submit-btn" style={{ background: 'var(--red)' }}>Ya, Hapus</button>
      </form>
      <Link href={`/divisi/${id}`} style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: 12, color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>
        Batal
      </Link>
    </FormShell>
  )
}
