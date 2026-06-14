/** Build participant dashboard URL from site origin (with or without /yc/p suffix). */
export function buildParticipantUrl(baseUrl: string, token: string): string {
  const origin = baseUrl.trim().replace(/\/$/, '').replace(/\/yc\/p$/, '')
  return `${origin}/yc/p/${token}`
}

/** Site origin for QR manifest — strips /yc/p if present. */
export function normalizeQrBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/$/, '').replace(/\/yc\/p$/, '')
}

export function resolveQrBaseUrl(): string {
  return (
    process.env.YC_QR_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  )
}
