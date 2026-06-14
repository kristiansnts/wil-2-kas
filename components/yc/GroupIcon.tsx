'use client'

import { useState } from 'react'
import { getGroupIconUrl } from '@/lib/yc/group-icon'

export function GroupIcon({
  name,
  slug,
  size = 36,
  className,
}: {
  name: string
  slug: string
  size?: number
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const cls = ['yc-group-icon', className].filter(Boolean).join(' ')

  if (!broken) {
    return (
      <img
        src={getGroupIconUrl(slug)}
        alt=""
        className={cls}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <div
      className={`${cls} yc-group-icon-fallback`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden
    >
      {name[0] ?? '?'}
    </div>
  )
}
