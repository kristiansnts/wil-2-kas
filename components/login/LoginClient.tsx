'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'

export default function LoginClient() {
  const [state, action, isPending] = useActionState(login, null)

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg)',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
            Kas Manager
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
            Masuk untuk melanjutkan
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                name="username"
                type="text"
                placeholder="admin / nama komisi"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                name="password"
                type="password"
                placeholder="••••••"
                required
              />
            </div>

            {state?.error && (
              <div style={{
                fontSize: 13,
                color: 'var(--red)',
                padding: '10px 12px',
                background: 'var(--red-light)',
                borderRadius: 8,
              }}>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isPending}
              style={{ marginTop: 4 }}
            >
              {isPending ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
