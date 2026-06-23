'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import TeamChallengeClient from '@/components/yc/participant/TeamChallengeClient'
import { isTeamChallengeSlug } from '@/lib/yc/features'

type Challenge = {
  slug: string
  title: string
  type: string
  description: string | null
  points: number
  teamStatus: string | null
  fragmentsRecovered?: number
  fragmentsTotal?: number
}

export default function ChallengeDetailClient({
  token,
  challenge,
  showEmergencyAlarm = false,
}: {
  token: string
  challenge: Challenge
  showEmergencyAlarm?: boolean
}) {
  const router = useRouter()
  const [answerText, setAnswerText] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  async function submitIndividual() {
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${challenge.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerText, mediaUrl: mediaUrl || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal submit')
        return
      }
      setAlert('Submission terkirim! Menunggu verifikasi panitia.')
      router.refresh()
    } catch {
      setAlert('Gagal submit')
    } finally {
      setLoading(false)
    }
  }

  if (challenge.type === 'TEAM' && isTeamChallengeSlug(challenge.slug)) {
    return (
      <TeamChallengeClient
        token={token}
        challenge={challenge}
        showEmergencyAlarm={showEmergencyAlarm}
      />
    )
  }

  return (
    <FormShell title={challenge.title} sub={`${challenge.points} poin`} back={`/yc/p/${token}/challenge`}>
      {challenge.description && (
        <div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.5 }}>
          {challenge.description}
        </div>
      )}

      {
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Jawaban</label>
            <textarea className="form-input" rows={4} value={answerText} onChange={e => setAnswerText(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">URL Media (opsional)</label>
            <input className="form-input" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." />
          </div>
          <button className="submit-btn" disabled={loading} onClick={submitIndividual}>
            {loading ? 'Mengirim...' : 'Submit Challenge'}
          </button>
        </div>
      }
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
