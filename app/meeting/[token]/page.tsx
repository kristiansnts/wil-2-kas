import { getMeetingByToken } from '@/lib/actions/meeting'
import PastorFormClient from '@/components/meeting/PastorFormClient'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getMeetingByToken(token)

  if (!data) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="card" style={{ margin: 24, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Link tidak valid</div>
          <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>Formulir tidak ditemukan.</div>
        </div>
      </div>
    )
  }

  const isPastDeadline = new Date() > new Date(data.deadline)
  if (isPastDeadline || data.status === 'closed') {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="card" style={{ margin: 24, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Formulir sudah ditutup</div>
          <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>Terima kasih atas partisipasi Anda.</div>
        </div>
      </div>
    )
  }

  return (
    <PastorFormClient
      token={data.token}
      month={data.month}
      deadline={data.deadline}
      pastors={data.pastors}
      divisions={data.divisions}
    />
  )
}
