'use client'

import { FormShell } from '@/components/forms/FormShell'
import { YC_OUTBOUND_GUESS_POINTS, YC_OUTBOUND_WIN_POINTS } from '@/lib/yc/constants'

type Challenge = {
  title: string
  description: string | null
  points: number
}

const RULES = [
  'Ikuti jadwal ronde di setiap pos Outbound.',
  'Setelah ronde selesai, tebak tim lawan di ronde berikutnya.',
  `Tebakan benar = +${YC_OUTBOUND_GUESS_POINTS} poin per tim.`,
  `Tim pemenang game di pos = +${YC_OUTBOUND_WIN_POINTS} poin.`,
  'Panitia mencatat tebakan dan pemenang — tidak perlu scan QR di aplikasi.',
]

export default function OutboundChallengeClient({
  token,
  challenge,
}: {
  token: string
  challenge: Challenge
}) {
  return (
    <FormShell title={challenge.title} sub={`Tebakan benar · ${challenge.points} poin`} back={`/yc/p/${token}/challenge`}>
      {challenge.description && (
        <div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.5 }}>
          {challenge.description}
        </div>
      )}

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Cara Main</div>
        <ol className="yc-progress-hint" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          {RULES.map(rule => (
            <li key={rule} style={{ marginBottom: 8 }}>{rule}</li>
          ))}
        </ol>
      </div>

      <div className="empty">
        <div className="empty-icon">🎯</div>
        <div className="empty-text">Main di Lokasi Outbound</div>
        <div className="empty-sub">Datang ke pos sesuai jadwal kelompokmu. Scan QR hanya untuk Perburuan Harta Karun.</div>
      </div>
    </FormShell>
  )
}
