'use client'

import { useState } from 'react'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import { updateSettingUrl } from '@/lib/yc/actions/admin'

export default function SettingUrlClient({
  kind,
  currentUrl,
  defaultUrl,
}: {
  kind: 'rundown' | 'kamar'
  currentUrl: string
  defaultUrl: string
}) {
  const [url, setUrl] = useState(currentUrl)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSettingUrl(kind, url)
      setAlert('Tersimpan')
    } catch {
      setAlert('Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const title = kind === 'rundown' ? 'Rundown PDF' : 'Kamar PDF'

  return (
    <FormShell title={title} back="/yc/admin">
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">URL PDF</label>
          <input className="form-input" value={url} onChange={e => setUrl(e.target.value)} placeholder={defaultUrl} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Default: {defaultUrl}</p>
        <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
      </form>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
