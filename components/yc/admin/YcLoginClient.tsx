'use client'

import { useActionState } from 'react'
import { ycLogin } from '@/lib/yc/actions/auth'
import { YC_BRAND } from '@/lib/yc/constants'

export default function YcLoginClient() {
  const [state, action, isPending] = useActionState(ycLogin, null)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{YC_BRAND}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>Login Panitia</div>
        </div>
        <form action={action} style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" name="password" type="password" required />
          </div>
          {state?.error && (
            <div style={{ fontSize: 13, color: 'var(--red)', padding: 10, background: 'var(--red-light)', borderRadius: 8 }}>{state.error}</div>
          )}
          <button type="submit" className="submit-btn" disabled={isPending}>{isPending ? 'Masuk...' : 'Masuk'}</button>
        </form>
      </div>
    </div>
  )
}
