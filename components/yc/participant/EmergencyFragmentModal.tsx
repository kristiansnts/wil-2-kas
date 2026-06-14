'use client'

import { useRouter } from 'next/navigation'
import { stopEmergencyAlarm } from '@/lib/yc/emergency-sound'

type Props = {
  token: string
  challengeSlug: string
  emergencyCalledAt: string
  onDismiss: (emergencyCalledAt: string) => void
}

export default function EmergencyFragmentModal({
  token,
  challengeSlug,
  emergencyCalledAt,
  onDismiss,
}: Props) {
  const router = useRouter()

  function muteAlarm() {
    stopEmergencyAlarm()
    onDismiss(emergencyCalledAt)
  }

  function gatherAtHall() {
    stopEmergencyAlarm()
    onDismiss(emergencyCalledAt)
    router.push(`/yc/p/${token}/challenge/${challengeSlug}/emergency`)
  }

  return (
    <div className="yc-emergency-modal-overlay" role="dialog" aria-modal="true">
      <div className="yc-emergency-modal">
        <div className="yc-emergency-modal-icon">🧩</div>
        <h2 className="yc-emergency-modal-title">Memory Fragment Ditemukan!</h2>
        <p className="yc-emergency-modal-text">
          Seseorang menemukan QR Fragment di kelompokmu. Kumpul di <strong>Aula</strong> sekarang.
        </p>
        <div className="yc-emergency-modal-actions">
          <button
            type="button"
            className="yc-emergency-modal-btn yc-emergency-modal-btn--muted"
            onClick={muteAlarm}
          >
            Matikan Alarm
          </button>
          <button
            type="button"
            className="yc-emergency-modal-btn yc-emergency-modal-btn--primary"
            onClick={gatherAtHall}
          >
            Kumpul ke Aula
          </button>
        </div>
      </div>
    </div>
  )
}
