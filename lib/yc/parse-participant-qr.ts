/** Extract participant token from nametag QR (URL or bare token). */
export function parseParticipantTokenFromQr(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const pathMatch = trimmed.match(/\/yc\/p\/([^/?#]+)/)
  if (pathMatch) return decodeURIComponent(pathMatch[1])

  try {
    const url = new URL(trimmed)
    const parts = url.pathname.split('/').filter(Boolean)
    const pIdx = parts.indexOf('p')
    if (pIdx >= 0 && parts[pIdx + 1]) {
      return decodeURIComponent(parts[pIdx + 1])
    }
  } catch {
    /* not a full URL */
  }

  if (/^[A-Za-z0-9_-]{10,24}$/.test(trimmed)) return trimmed

  return ''
}
