import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { fmt, fmtDate } from '@/lib/format'

export default async function DivisionTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string; txnId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id, txnId } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id: txnId, scope: 'divisi', divisionId: id },
    include: {
      division: true,
      event: true,
    },
  })

  if (!transaction) notFound()

  const division = transaction.division!
  const isTransferFromUmum = transaction.desc === 'Transfer dari Kas Umum'
  const readOnly = session.role === 'admin'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/divisi/${id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--primary)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Kembali ke {division.name}
        </Link>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>Detail Transaksi</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{division.name}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Type & Category Badges */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Tipe
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: transaction.type === 'masuk' ? 'var(--green-light)' : 'var(--red-light)',
                  color: transaction.type === 'masuk' ? 'var(--green)' : 'var(--red)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {transaction.type === 'masuk' ? '↑' : '↓'} {transaction.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
              </div>
              {transaction.kategori && (
                <span
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: transaction.kategori === 'harian' ? 'var(--accent-light)' : 'var(--primary-light)',
                    color: transaction.kategori === 'harian' ? 'var(--accent)' : 'var(--primary)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {transaction.kategori === 'harian' ? 'Harian' : 'Event'}
                </span>
              )}
              {isTransferFromUmum && (
                <span
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Transfer dari Kas Umum
                </span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Jumlah
            </label>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: transaction.type === 'masuk' ? 'var(--green)' : 'var(--red)',
              }}
            >
              {transaction.type === 'masuk' ? '+' : '-'} {fmt(transaction.amount)}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Keterangan
            </label>
            <div style={{ fontSize: 16, color: 'var(--fg)' }}>{transaction.desc}</div>
          </div>

          {/* Event */}
          {transaction.event && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Event
              </label>
              <div style={{ fontSize: 16, color: 'var(--fg)' }}>{transaction.event.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Tanggal event: {fmtDate(transaction.event.date.toISOString())}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Tanggal Transaksi
            </label>
            <div style={{ fontSize: 16, color: 'var(--fg)' }}>{fmtDate(transaction.date.toISOString())}</div>
          </div>

          {/* Attachment */}
          {transaction.attachmentUrl && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Lampiran
              </label>
              {transaction.attachmentUrl.endsWith('.pdf') ? (
                <a
                  href={transaction.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 8,
                    background: 'var(--accent)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  📄 Lihat PDF
                </a>
              ) : (
                <div>
                  <a href={transaction.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={transaction.attachmentUrl}
                      alt="Lampiran transaksi"
                      style={{
                        width: '100%',
                        maxWidth: 600,
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    />
                  </a>
                  <a
                    href={transaction.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      color: 'var(--primary)',
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    🔍 Buka gambar dalam tab baru
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid var(--border)',
            }}
          >
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Informasi Tambahan
            </label>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              ID Transaksi: {transaction.id}
              <br />
              Dibuat: {new Date(transaction.createdAt).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
