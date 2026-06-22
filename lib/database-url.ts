const LEGACY_SSL_MODES = new Set(['prefer', 'require', 'verify-ca'])

function normalizePgUrl(url: string): string {

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

function readEnvUrl(name: 'DATABASE_URL' | 'DIRECT_URL'): string {
  const url = process.env[name]
  if (!url) throw new Error(`${name} is not set`)
  return normalizePgUrl(url)
}

/** Pooled URL for runtime queries (Prisma Postgres: pooled.db.prisma.io). */
export function getDatabaseUrl(): string {
  return readEnvUrl('DATABASE_URL')
}

/** Direct URL for migrations and CLI scripts (Prisma Postgres: db.prisma.io). */
export function getDirectDatabaseUrl(): string {
  return readEnvUrl('DIRECT_URL')
}
