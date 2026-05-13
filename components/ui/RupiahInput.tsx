'use client'

interface Props {
  value: string
  onChange: (raw: string) => void
  onFocus?: () => void
  required?: boolean
  className?: string
}

function fmtDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return 'Rp ' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function RupiahInput({ value, onChange, onFocus, required, className = 'form-input' }: Props) {
  return (
    <input
      className={className}
      type="text"
      inputMode="numeric"
      placeholder="Rp 0"
      value={fmtDisplay(value)}
      onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      onFocus={onFocus}
      required={required}
    />
  )
}
