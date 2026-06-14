'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { GENDER_OPTIONS, SERVICE_OPTIONS } from '@/lib/yc/constants'
import type { ServiceInterest, YcGender } from '@/lib/yc/constants'

type Church = { value: string; label: string }

export default function RegisterClient({
  token,
  churches,
  initial,
}: {
  token: string
  churches: Church[]
  initial: {
    name: string | null
    gender: YcGender | null
    churchName: string | null
    instagram: string | null
    tiktok: string | null
    serviceInterest: ServiceInterest[]
  }
}) {
  const router = useRouter()
  const [name, setName] = useState(initial.name ?? '')
  const [gender, setGender] = useState<YcGender | ''>(initial.gender ?? '')
  const [churchName, setChurchName] = useState(initial.churchName ?? '')
  const [instagram, setInstagram] = useState(initial.instagram ?? '')
  const [tiktok, setTiktok] = useState(initial.tiktok ?? '')
  const [interests, setInterests] = useState<ServiceInterest[]>(initial.serviceInterest)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  function toggleInterest(v: ServiceInterest) {
    setInterests(prev => (prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/register`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender, churchName, instagram, tiktok, serviceInterest: interests }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal menyimpan')
        return
      }
      router.push(`/yc/p/${token}`)
      router.refresh()
    } catch {
      setAlert('Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormShell title="Registrasi Ulang" sub="Lengkapi data peserta" back={`/yc/p/${token}`}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Nama Lengkap</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Jenis Kelamin</label>
          <div style={{ display: 'flex', gap: 20 }}>
            {GENDER_OPTIONS.map(g => (
              <label key={g.value} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  value={g.value}
                  checked={gender === g.value}
                  onChange={() => setGender(g.value)}
                  required
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Asal Gereja</label>
          <SearchableSelect
            options={churches}
            value={churchName}
            onChange={setChurchName}
            placeholder="Pilih gereja"
            searchPlaceholder="Cari gereja..."
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Pelayanan yang Diminati</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SERVICE_OPTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleInterest(s.value)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  border: interests.includes(s.value) ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: interests.includes(s.value) ? 'var(--accent-light)' : 'var(--surface)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Instagram</label>
          <input className="form-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />
        </div>
        <div className="form-group">
          <label className="form-label">TikTok</label>
          <input className="form-input" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
