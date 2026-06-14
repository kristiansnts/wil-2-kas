'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

type Props = {
  onScan: (text: string) => void
  onError?: (message: string) => void
}

export default function QrScanner({ onScan, onError }: Props) {
  const reactId = useId()
  const containerId = `yc-qr-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const handledRef = useRef(false)
  const [starting, setStarting] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const handleScan = useCallback(
    (text: string) => {
      if (handledRef.current) return
      handledRef.current = true
      onScan(text)
    },
    [onScan],
  )

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          decoded => handleScan(decoded),
          () => {},
        )

        if (!cancelled) setStarting(false)
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Tidak bisa membuka kamera. Izinkan akses kamera di browser.'
        setCameraError(msg)
        onError?.(msg)
        setStarting(false)
      }
    }

    start()

    return () => {
      cancelled = true
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        scanner.stop().catch(() => {})
      }
    }
  }, [containerId, handleScan, onError])

  return (
    <div className="yc-qr-scanner-wrap">
      <div id={containerId} className="yc-qr-scanner" />
      {starting && !cameraError && (
        <div className="yc-qr-scanner-overlay">Membuka kamera…</div>
      )}
      {cameraError && (
        <div className="yc-qr-scanner-error">{cameraError}</div>
      )}
    </div>
  )
}
