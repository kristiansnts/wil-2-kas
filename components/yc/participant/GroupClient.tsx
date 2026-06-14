'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import { GroupIcon } from '@/components/yc/GroupIcon'
import type { YcGroupDetail } from '@/lib/yc/types'

export default function GroupClient({
  token,
  group,
  participantId,
}: {
  token: string
  group: YcGroupDetail
  participantId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [groupName, setGroupName] = useState(group.name)

  const isCaptain = group.captain?.id === participantId
  const rolesReady = Boolean(group.captain && group.contentCreator)

  useEffect(() => {
    setGroupName(group.name)
  }, [group.name])

  async function claim(role: 'captain' | 'content-creator') {
    setLoading(role)
    try {
      const res = await fetch(`/yc/api/p/${token}/group/claim-${role}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal')
        return
      }
      router.refresh()
    } catch {
      setAlert('Gagal')
    } finally {
      setLoading(null)
    }
  }

  async function saveGroupName() {
    const trimmed = groupName.trim()
    if (!trimmed) {
      setAlert('Nama kelompok tidak boleh kosong')
      return
    }
    setLoading('name')
    try {
      const res = await fetch(`/yc/api/p/${token}/group/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal menyimpan')
        return
      }
      setGroupName(data.name)
      router.refresh()
    } catch {
      setAlert('Gagal menyimpan')
    } finally {
      setLoading(null)
    }
  }

  const canClaimCaptain = !group.captain
  const canClaimCC = !group.contentCreator

  return (
    <FormShell title="Kelompok" sub={groupName} back={`/yc/p/${token}`}>
      <div className="yc-group-hero">
        <GroupIcon name={group.name} slug={group.slug} size={200} />
      </div>

      <div className="stats-row">
        <div className="stat-pill">
          <div className="stat-pill-label">Poin</div>
          <div className="stat-pill-val">{group.points}</div>
        </div>
        {rolesReady && (
          <div className="stat-pill">
            <div className="stat-pill-label">Anggota</div>
            <div className="stat-pill-val">{group.members.length}</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="txn-row">
          <div className="txn-info">
            <div className="txn-desc">Captain</div>
            <div className="txn-meta">{group.captain?.name ?? 'Belum diklaim'}</div>
          </div>
          {canClaimCaptain && (
            <button
              type="button"
              className="submit-btn"
              style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
              disabled={loading === 'captain'}
              onClick={() => claim('captain')}
            >
              Claim
            </button>
          )}
        </div>
        <div className="txn-row">
          <div className="txn-info">
            <div className="txn-desc">Content Creator</div>
            <div className="txn-meta">{group.contentCreator?.name ?? 'Belum diklaim'}</div>
          </div>
          {canClaimCC && (
            <button
              type="button"
              className="submit-btn"
              style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
              disabled={loading === 'content-creator'}
              onClick={() => claim('content-creator')}
            >
              Claim
            </button>
          )}
        </div>
        {!rolesReady && (
          <div className="yc-group-hint">
            Klaim Captain dan Content Creator dulu untuk membuka daftar anggota.
          </div>
        )}
      </div>

      {isCaptain ? (
        <div className="card yc-group-name-card">
          <div className="form-group">
            <label className="form-label" htmlFor="group-name">Nama Kelompok</label>
            <input
              id="group-name"
              className="form-input"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              maxLength={60}
              placeholder="Masukkan nama kelompok"
            />
          </div>
          <button
            type="button"
            className="submit-btn"
            style={{ marginTop: 12 }}
            disabled={loading === 'name' || groupName.trim() === group.name}
            onClick={saveGroupName}
          >
            {loading === 'name' ? 'Menyimpan...' : 'Simpan Nama'}
          </button>
        </div>
      ) : (
        <div className="card yc-group-name-card">
          <div className="form-group">
            <div className="form-label">Nama Kelompok</div>
            <div className="yc-group-name-value">{groupName}</div>
          </div>
        </div>
      )}

      {rolesReady && (
        <>
          <div className="section-header">
            <div className="section-title">Anggota</div>
          </div>
          <div className="card">
            {group.members.map(m => (
              <div key={m.id} className="txn-row">
                <div className="div-avatar">{m.name?.[0] ?? '?'}</div>
                <div className="txn-info">
                  <div className="txn-desc">{m.name ?? 'Belum registrasi'}</div>
                  {m.id === participantId && <div className="txn-meta">Anda</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
