'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ycLogClient } from '@/lib/yc/log'

type Props = {
  token: string
  onScan: (text: string) => void
  onError?: (message: string) => void
}

type Html5QrcodeInstance = {
  start: (
    constraints: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decoded: string) => void,
    onFailure: (error: string) => void,
  ) => Promise<null>
  stop: () => Promise<void>
}

export default function QrScanner({ token, onScan, onError }: Props) {
  const reactId = useId()
  const containerId = `yc-qr-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef<Html5QrcodeInstance | null>(null)
  const scanningRef = useRef(false)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  const handledRef = useRef(false)
  const [starting, setStarting] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  onScanRef.current = onScan
  onErrorRef.current = onError

  useEffect(() => {
    let cancelled = false
    handledRef.current = false
    ycLogClient(token, 'qr-scanner', 'mount', { containerId })

    async function stopScanner(reason: string) {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (!scanner || !scanningRef.current) return
      scanningRef.current = false
      try {
        await scanner.stop()
        ycLogClient(token, 'qr-scanner', 'stopped', { reason })
      } catch (e) {
        ycLogClient(token, 'qr-scanner', 'stop_error', {
          reason,
          message: e instanceof Error ? e.message : String(e),
        })
      }
    }

    async function start() {
      try {
        ycLogClient(token, 'qr-scanner', 'start_begin', { containerId })
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        await stopScanner('before_start')

        const scanner = new Html5Qrcode(containerId) as Html5QrcodeInstance
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          decoded => {
            void (async () => {
              if (handledRef.current || cancelled) return
              handledRef.current = true
              ycLogClient(token, 'qr-scanner', 'decoded', {
                len: decoded.length,
                preview: decoded.slice(0, 80),
              })
              await stopScanner('after_decode')
              if (!cancelled) onScanRef.current(decoded)
            })()
          },
          () => {},
        )
        scanningRef.current = true
        ycLogClient(token, 'qr-scanner', 'start_ok', { containerId })

        if (!cancelled) setStarting(false)
      } catch (e) {
        if (cancelled) return
        const msg =
          e instanceof Error
            ? e.message
            : 'Tidak bisa membuka kamera. Izinkan akses kamera di browser.'
        ycLogClient(token, 'qr-scanner', 'start_error', { message: msg })
        setCameraError(msg)
        onErrorRef.current?.(msg)
        setStarting(false)
      }
    }

    void start()

    return () => {
      cancelled = true
      ycLogClient(token, 'qr-scanner', 'unmount', { containerId })
      void stopScanner('unmount')
    }
  }, [containerId, token])

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
