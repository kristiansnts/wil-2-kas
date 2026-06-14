'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import EmergencyFragmentModal from '@/components/yc/participant/EmergencyFragmentModal'
import {
  getBannerDismissedAt,
  isEmergencyAlarmPlaying,
  playEmergencyAlarm,
  setBannerDismissedAt,
  stopEmergencyAlarm,
} from '@/lib/yc/emergency-sound'
import type { YcEmergencyActive } from '@/lib/yc/types'

type BlockingEmergency = {
  calledAt: string
  challengeSlug: string
}

export default function EmergencySoundProvider({
  token,
  children,
}: {
  token: string
  children: React.ReactNode
}) {
  const [blocking, setBlocking] = useState<BlockingEmergency | null>(null)
  const ackRef = useRef<string | null>(null)

  const isAcknowledged = useCallback((calledAt: string) => {
    if (ackRef.current === calledAt) return true
    return getBannerDismissedAt() === calledAt
  }, [])

  const dismissModal = useCallback((emergencyCalledAt: string) => {
    ackRef.current = emergencyCalledAt
    setBannerDismissedAt(emergencyCalledAt)
    setBlocking(null)
    stopEmergencyAlarm()
  }, [])

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/yc/api/p/${token}/emergency/active`)
      if (!res.ok) return
      const data: YcEmergencyActive = await res.json()

      if (!data.active || !data.emergencyCalledAt || !data.challengeSlug) {
        setBlocking(null)
        stopEmergencyAlarm()
        return
      }

      const inGatherPhase = data.status === 'EMERGENCY' || data.status === 'WAITING'
      if (!inGatherPhase) {
        setBlocking(null)
        stopEmergencyAlarm()
        return
      }

      const calledAt = data.emergencyCalledAt
      if (isAcknowledged(calledAt)) {
        setBlocking(null)
        stopEmergencyAlarm()
        return
      }

      setBlocking(prev =>
        prev?.calledAt === calledAt
          ? prev
          : { calledAt, challengeSlug: data.challengeSlug! },
      )
    } catch {
      /* ignore */
    }
  }, [token, isAcknowledged])

  useEffect(() => {
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [poll])

  useEffect(() => {
    if (!blocking) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    playEmergencyAlarm()
    const id = setInterval(() => {
      if (!isEmergencyAlarmPlaying()) playEmergencyAlarm()
    }, 1500)
    return () => {
      clearInterval(id)
      document.body.style.overflow = ''
    }
  }, [blocking])

  return (
    <>
      {blocking && (
        <EmergencyFragmentModal
          token={token}
          challengeSlug={blocking.challengeSlug}
          emergencyCalledAt={blocking.calledAt}
          onDismiss={dismissModal}
        />
      )}
      {children}
    </>
  )
}
