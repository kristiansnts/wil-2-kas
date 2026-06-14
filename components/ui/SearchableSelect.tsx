'use client'

import { useState, useRef, useEffect } from 'react'

type Option = { value: string; label: string }

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  required,
}: {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  required?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggle() {
    setOpen(o => {
      if (o) setQuery('')
      return !o
    })
  }

  function pick(v: string) {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {required && (
        <input
          type="text"
          required
          value={value}
          readOnly
          tabIndex={-1}
          aria-hidden
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
        />
      )}
      <div className="form-select" onClick={toggle} style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, color: selected ? undefined : 'var(--text-sub)' }}>
          {selected?.label ?? placeholder}
        </span>
      </div>
      {open && (
        <div className="searchable-dropdown" style={{ width: '100%' }}>
          <input
            className="searchable-search"
            autoFocus
            type="search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="searchable-list">
            {filtered.length === 0 ? (
              <div className="searchable-option" style={{ color: 'var(--text-sub)', cursor: 'default' }}>
                Tidak ada hasil
              </div>
            ) : (
              filtered.map(o => (
                <div
                  key={o.value}
                  className={`searchable-option${o.value === value ? ' active' : ''}`}
                  onMouseDown={e => {
                    e.preventDefault()
                    pick(o.value)
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
