'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { GroupIcon } from '@/components/yc/GroupIcon'
import { forceOpenQuiz, resetTeamSession } from '@/lib/yc/actions/admin'

type Session = {
  id: string
  groupName: string
  groupSlug: string
  challengeTitle: string
  challengeSlug: string
  groupId: string
  status: string
  emergencyStatus: {
    readyCount: number
    totalCount: number
    waitingFor: string[]
  } | null
}

export default function EmergencyMonitorClient({ sessions }: { sessions: Session[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function run(key: string, fn: () => Promise<unknown>) {
    setLoading(key)
    try {
      await fn()
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <FormShell title="Emergency Monitor" back="/yc/admin">
      {sessions.length === 0 ? (
        <div className="empty"><div className="empty-text">Tidak ada session aktif</div></div>
      ) : (
        sessions.map(s => (
          <div key={s.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GroupIcon name={s.groupName} slug={s.groupSlug} size={28} />
              {s.groupName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.challengeTitle} · {s.status}</div>
            {s.emergencyStatus && (
              <div style={{ fontSize: 13, marginTop: 8 }}>
                Ready: {s.emergencyStatus.readyCount}/{s.emergencyStatus.totalCount}
                {s.emergencyStatus.waitingFor.length > 0 && ` · Tunggu: ${s.emergencyStatus.waitingFor.join(', ')}`}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="submit-btn"
                style={{ flex: 1, fontSize: 13 }}
                disabled={loading === `${s.id}-quiz`}
                onClick={() => run(`${s.id}-quiz`, () => forceOpenQuiz(s.groupId, s.challengeSlug))}
              >
                Force Quiz
              </button>
              <button
                className="submit-btn"
                style={{ flex: 1, fontSize: 13, background: 'var(--red)' }}
                disabled={loading === `${s.id}-reset`}
                onClick={() => run(`${s.id}-reset`, () => resetTeamSession(s.groupId, s.challengeSlug))}
              >
                Reset
              </button>
            </div>
          </div>
        ))
      )}
    </FormShell>
  )
}
