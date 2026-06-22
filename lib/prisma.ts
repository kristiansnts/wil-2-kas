import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { getDatabaseUrl } from '@/lib/database-url'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pgPool?: pg.Pool
}

function getPool() {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString: getDatabaseUrl(),
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    })
  }
  return globalForPrisma.pgPool
}

function createPrisma() {
  return new PrismaClient({ adapter: new PrismaPg(getPool()) })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()
globalForPrisma.prisma = prisma
