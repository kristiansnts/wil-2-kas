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
  if (isPooledPrismaHost(url)) return url
  return url.replace('@db.prisma.io', '@pooled.db.prisma.io')
}

function toDirectPrismaHost(url: string): string {
  if (isDirectPrismaHost(url)) return url
  return url.replace('@pooled.db.prisma.io', '@db.prisma.io')
}

/** Pooled URL for runtime queries. Works with Vercel Storage auto-provisioned vars. */
export function getDatabaseUrl(): string {
  const candidates = [
    process.env.DATABASE_PRISMA_DATABASE_URL,
    process.env.DATABASE_POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ].filter((url): url is string => Boolean(url))

  const pooled = candidates.find(isPooledPrismaHost)
  if (pooled) return normalizePgUrl(pooled)

  const direct = candidates.find(isDirectPrismaHost)
  if (direct) return normalizePgUrl(toPooledPrismaHost(direct))

  const fallback = firstEnv('DATABASE_URL')
  if (!fallback) {
    throw new Error(
      'No database URL found. Connect Prisma Postgres via Vercel Storage or set DATABASE_URL.',
    )
  }

  return normalizePgUrl(toPooledPrismaHost(fallback))
}

/** Direct URL for migrations and CLI scripts. */
export function getDirectDatabaseUrl(): string {
  const candidates = [
    process.env.DIRECT_URL,
    process.env.DATABASE_URL,
    process.env.DATABASE_POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_PRISMA_DATABASE_URL,
    process.env.DATABASE_POSTGRES_URL,
    process.env.POSTGRES_URL,
  ].filter((url): url is string => Boolean(url))

  const direct = candidates.find(isDirectPrismaHost)
  if (direct) return normalizePgUrl(direct)

  const pooled = candidates.find(isPooledPrismaHost)
  if (pooled) return normalizePgUrl(toDirectPrismaHost(pooled))

  const fallback = firstEnv('DIRECT_URL', 'DATABASE_URL')
  if (!fallback) {
    throw new Error(
      'No direct database URL found. Connect Prisma Postgres via Vercel Storage or set DIRECT_URL.',
    )
  }

  return normalizePgUrl(toDirectPrismaHost(fallback))
}
