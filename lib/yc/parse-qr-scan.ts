/** Extract emergency QR code from raw scanner text (bare code or /scan/{code} URL). */
export function parseScannedQrCode(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const pathMatch = trimmed.match(/\/scan\/([^/?#]+)/)
  if (pathMatch) return decodeURIComponent(pathMatch[1])

  try {
    const url = new URL(trimmed)
    const parts = url.pathname.split('/').filter(Boolean)
    const scanIdx = parts.indexOf('scan')
    if (scanIdx >= 0 && parts[scanIdx + 1]) {
      return decodeURIComponent(parts[scanIdx + 1])
    }
  } catch {
    /* not a full URL */
  }

  return trimmed
}
