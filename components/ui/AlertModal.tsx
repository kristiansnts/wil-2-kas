'use client'

import { useEffect, useRef } from 'react'

interface Props {
  message: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
}

export function AlertModal({ message, onClose, onConfirm, confirmLabel = 'Ya, Setujui' }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    btnRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && onConfirm) onConfirm()
      if (e.key === 'Enter' && !onConfirm) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onConfirm])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 320, width: '100%', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}
      >
        <div style={{ padding: '24px 24px 18px', fontSize: 18, lineHeight: 1.55, color: 'var(--text)' }}>
          {message}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex' }}>
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', fontSize: 17, fontWeight: 600, color: 'var(--text-sub)', fontFamily: 'inherit' }}
              >
                Batal
              </button>
              <button
                ref={btnRef}
                onClick={onConfirm}
                style={{ flex: 1, padding: '15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, fontWeight: 600, color: 'var(--accent)', fontFamily: 'inherit' }}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              ref={btnRef}
              onClick={onClose}
              style={{ flex: 1, padding: '15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, fontWeight: 600, color: 'var(--accent)', fontFamily: 'inherit' }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
