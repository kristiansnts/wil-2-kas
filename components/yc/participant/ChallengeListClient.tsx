'use client'

import Link from 'next/link'
import { FormShell } from '@/components/forms/FormShell'
import type { YcChallengeListItem } from '@/lib/yc/types'

export default function ChallengeListClient({
  token,
  challenges,
}: {
  token: string
  challenges: YcChallengeListItem[]
}) {
  const base = `/yc/p/${token}/challenge`

  return (
    <FormShell title="Challenge" back={`/yc/p/${token}`}>
      {challenges.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🏆</div>
          <div className="empty-text">Belum ada challenge aktif</div>
        </div>
      ) : (
        <div className="card">
          {challenges.map(c => {
            const href = c.isDocumentationChallenge
              ? `/yc/p/${token}/dokumentasi`
              : `${base}/${c.slug}`
            return (
              <Link key={c.id} href={href} className="txn-row" style={{ textDecoration: 'none' }}>
                <div className="txn-info">
                  <div className="txn-desc">{c.title}</div>
                  <div className="txn-meta">
                    {c.isDocumentationChallenge
                      ? `${c.points} poin/upload · Personal atau Kelompok`
                      : c.isExtrovertChallenge
                        ? `50–150 poin/pasangan · Scan name tag`
                        : c.isOutboundChallenge
                          ? `Tebakan +${c.points} poin · Main di lokasi pos`
                          : `${c.type === 'TEAM' ? 'Team' : 'Individual'} · ${c.points} poin`}
                    {c.completed && ' · ✓ Selesai'}
                  </div>
                </div>
                <span className="badge transfer">
                  {c.submissionStatus ?? (c.completed ? 'DONE' : 'GO')}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </FormShell>
  )
}
