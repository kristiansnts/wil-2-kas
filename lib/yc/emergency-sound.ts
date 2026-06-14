import { YC_EMERGENCY_SOUND_PATH } from './constants'

let alarmAudio: HTMLAudioElement | null = null

export function isEmergencySoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('yc-emergency-sound') === '1'
}

export function setEmergencySoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  if (enabled) {
    localStorage.setItem('yc-emergency-sound', '1')
  } else {
    localStorage.removeItem('yc-emergency-sound')
  }
}

export function getLastSeenEmergencyAt(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('yc-emergency-last-at')
}

export function setLastSeenEmergencyAt(iso: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('yc-emergency-last-at', iso)
}

export function getBannerDismissedAt(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('yc-emergency-modal-ack-at')
}

export function setBannerDismissedAt(iso: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('yc-emergency-modal-ack-at', iso)
}

export async function testEmergencySound(): Promise<boolean> {
  const audio = getAlarmAudio()
  audio.loop = false
  audio.currentTime = 0
  try {
    await audio.play()
    return true
  } catch {
    return false
  }
}

function getAlarmAudio() {
  if (!alarmAudio) {
    alarmAudio = new Audio(YC_EMERGENCY_SOUND_PATH)
    alarmAudio.preload = 'auto'
  }
  return alarmAudio
}

export async function playEmergencyAlarm() {
  const audio = getAlarmAudio()
  audio.loop = true
  if (!audio.paused) return
  audio.currentTime = 0
  try {
    await audio.play()
  } catch {
    /* autoplay blocked until user interacts */
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([300, 100, 300, 100, 300])
  }
}

export function isEmergencyAlarmPlaying(): boolean {
  return Boolean(alarmAudio && !alarmAudio.paused && !alarmAudio.ended)
}

export function stopEmergencyAlarm() {
  if (!alarmAudio) return
  alarmAudio.pause()
  alarmAudio.currentTime = 0
  alarmAudio.loop = false
}
