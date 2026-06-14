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

function resetAlarmAudio() {
  if (!alarmAudio) return
  alarmAudio.pause()
  alarmAudio.removeAttribute('src')
  alarmAudio.load()
  alarmAudio = null
}

function createAlarmAudio() {
  const audio = new Audio(YC_EMERGENCY_SOUND_PATH)
  audio.preload = 'auto'
  return audio
}

function getAlarmAudio() {
  if (!alarmAudio) {
    alarmAudio = createAlarmAudio()
  }
  return alarmAudio
}

/** Wait until the file is loaded — mobile networks need this before play(). */
function waitForAudioReady(audio: HTMLAudioElement, timeoutMs = 8000): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('audio load timeout'))
    }, timeoutMs)

    const onReady = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      reject(new Error('audio load failed'))
    }

    const cleanup = () => {
      window.clearTimeout(timer)
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('error', onError)
    }

    audio.addEventListener('canplaythrough', onReady, { once: true })
    audio.addEventListener('error', onError, { once: true })
    audio.load()
  })
}

export async function testEmergencySound(): Promise<boolean> {
  resetAlarmAudio()
  const audio = getAlarmAudio()
  audio.loop = false
  audio.currentTime = 0

  try {
    await waitForAudioReady(audio)
    await audio.play()
    return true
  } catch {
    resetAlarmAudio()
    return false
  }
}

export async function playEmergencyAlarm() {
  const audio = getAlarmAudio()
  audio.loop = true
  if (!audio.paused) return
  audio.currentTime = 0

  try {
    await waitForAudioReady(audio)
    await audio.play()
  } catch {
    /* autoplay blocked until user interacts, or load failed on slow network */
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
