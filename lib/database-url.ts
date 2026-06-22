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

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }
  return undefined
}

function isPooledPrismaHost(url: string): boolean {
  return url.includes('pooled.db.prisma.io')
}

function isDirectPrismaHost(url: string): boolean {
  return url.includes('@db.prisma.io') && !isPooledPrismaHost(url)
}

function toPooledPrismaHost(url: string): string {
  if (isPooledPrismaHost(url) || !isDirectPrismaHost(url)) return url
  return url.replace('@db.prisma.io', '@pooled.db.prisma.io')
}

function toDirectPrismaHost(url: string): string {
  if (isDirectPrismaHost(url) || !isPooledPrismaHost(url)) return url
  return url.replace('@pooled.db.prisma.io', '@db.prisma.io')
}

/** Runtime URL — prefers POSTGRES_URL from Vercel Storage. */
export function getDatabaseUrl(): string {
  const url = firstEnv(
    'POSTGRES_URL',
    'DATABASE_POSTGRES_URL',
    'DATABASE_PRISMA_DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'DATABASE_URL',
  )

  if (!url) {
    throw new Error('POSTGRES_URL is not set')
  }

  return normalizePgUrl(toPooledPrismaHost(url))
}

/** Direct URL for migrations and CLI scripts. */
export function getDirectDatabaseUrl(): string {
  const url = firstEnv(
    'POSTGRES_URL_NON_POOLING',
    'DIRECT_URL',
    'POSTGRES_URL',
    'DATABASE_URL',
  )

  if (!url) {
    throw new Error('POSTGRES_URL or DIRECT_URL is not set')
  }

  return normalizePgUrl(toDirectPrismaHost(url))
}
