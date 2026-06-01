import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { FormShell } from '@/components/forms/FormShell'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/login')

  const { id } = await params
  const meeting = await prisma.meeting.findUnique({ where: { id }, select: { token: true } })
  if (!meeting) notFound()

  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const url = `${proto}://${host}/meeting/${meeting.token}`

  return (
    <FormShell title="Link Pengisian" sub="Bagikan ke pendeta" back={`/pertemuan/${id}`}>
      <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 10 }}>
        Salin link berikut dan bagikan ke pendeta untuk mengisi formulir.
      </div>
      <input
        className="form-input"
        type="text"
        readOnly
        defaultValue={url}
        style={{ fontSize: 13 }}
      />
      <a
        href={`https://wa.me/?text=${encodeURIComponent(url)}`}
        style={{ display: 'block', textAlign: 'center', marginTop: 14, padding: 14, borderRadius: 14, background: 'var(--accent)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
      >
        Bagikan via WhatsApp
      </a>
    </FormShell>
  )
}
