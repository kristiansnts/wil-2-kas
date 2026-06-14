'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type ActiveInvite = {
  active: boolean
  challengeSlug?: string
  partnerName?: string
  needsStory?: boolean
}

export default function NametagPairingProvider({
  token,
  children,
}: {
  token: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const redirectedRef = useRef<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/yc/api/p/${token}/extrovert/active`)
      if (!res.ok) return
      const data: ActiveInvite = await res.json()

      if (!data.active || !data.challengeSlug) {
        redirectedRef.current = null
        return
      }

      const target = `/yc/p/${token}/challenge/${data.challengeSlug}`
      if (pathname === target) return

      const key = `${data.challengeSlug}-${data.partnerName}`
      if (redirectedRef.current === key) return
      redirectedRef.current = key

      router.push(target)
    } catch {
      /* ignore */
    }
  }, [token, pathname, router])

  useEffect(() => {
    poll()
    const id = setInterval(poll, 2500)
    return () => clearInterval(id)
  }, [poll])

  return <>{children}</>
}
