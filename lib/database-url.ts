const LEGACY_SSL_MODES = new Set(['prefer', 'require', 'verify-ca'])

/** Normalize pg sslmode to silence pg-connection-string v2 deprecation warning. */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  try {
    const parsed = new URL(url)
    const sslmode = parsed.searchParams.get('sslmode')
    if (sslmode && LEGACY_SSL_MODES.has(sslmode)) {
      parsed.searchParams.set('sslmode', 'verify-full')
      return parsed.toString()
    }
  } catch {
    // Non-URL connection strings are passed through unchanged.
  }

  return url
}
