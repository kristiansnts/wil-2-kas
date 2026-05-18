'use client'
import { useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
  required?: boolean
}

export function DateInput({ value, onChange, className, required }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const display = value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : ''

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className={className}
        value={display}
        readOnly
        placeholder="DD/MM/YYYY"
        style={{ cursor: 'pointer', paddingRight: 36 }}
      />
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer', zIndex: 1,
        }}
      />
    </div>
  )
}
