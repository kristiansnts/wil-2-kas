import 'dotenv/config'
import { unlink } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDirectDatabaseUrl } from '../lib/database-url'
import { readQrManifest, writeQrManifest } from '../lib/yc/qr-card'

const SMOKE_TOKEN_PREFIX = 'test-smoke'
const KEEP_UNTIL_NO = 120
const PESERTA_DIR = path.join(process.cwd(), 'public', 'qr', 'peserta')
const MANIFEST_PATH = path.join(process.cwd(), 'public', 'qr', 'manifest.json')

const adapter = new PrismaPg({ connectionString: getDirectDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

function padNum(n: number, width: number) {
  return String(n).padStart(width, '0')
}

async function main() {
  const manifest = await readQrManifest(MANIFEST_PATH)
  const removeEntries = manifest.peserta.filter(p => p.no > KEEP_UNTIL_NO)
  const removeTokens = removeEntries.map(p => p.token)

  console.log(`Manifest: ${manifest.peserta.length} → keep #1–${KEEP_UNTIL_NO}, remove ${removeEntries.length}`)

  const smoke = await prisma.ycParticipant.findMany({
    where: { token: { startsWith: SMOKE_TOKEN_PREFIX } },
    select: { id: true, token: true, name: true },
  })
  console.log(`Smoke tokens to remove: ${smoke.length}`)
  smoke.forEach(p => console.log(`  ${p.token} ${p.name ?? ''}`))

  const extra = await prisma.ycParticipant.findMany({
    where: { token: { in: removeTokens } },
    select: { id: true, token: true, name: true },
  })
  console.log(`Extra peserta #${KEEP_UNTIL_NO + 1}+ in DB: ${extra.length}`)

  const deleteIds = [
    ...smoke.map(p => p.id),
    ...extra.map(p => p.id),
  ]

  if (deleteIds.length > 0) {
    await prisma.ycGroup.updateMany({
      where: { captainParticipantId: { in: deleteIds } },
      data: { captainParticipantId: null },
    })
    await prisma.ycGroup.updateMany({
      where: { contentCreatorParticipantId: { in: deleteIds } },
      data: { contentCreatorParticipantId: null },
    })

    const deleted = await prisma.ycParticipant.deleteMany({
      where: { id: { in: deleteIds } },
    })
    console.log(`DB deleted: ${deleted.count} participants`)
  }

  for (const entry of removeEntries) {
    const filePath = path.join(PESERTA_DIR, `${padNum(entry.no, 3)}.jpg`)
    try {
      await unlink(filePath)
      console.log(`  removed ${path.relative(process.cwd(), filePath)}`)
    } catch {
      console.warn(`  missing file: ${filePath}`)
    }
  }

  const peserta = manifest.peserta.filter(p => p.no <= KEEP_UNTIL_NO)
  await writeQrManifest(MANIFEST_PATH, {
    ...manifest,
    generatedAt: new Date().toISOString(),
    peserta,
  })

  const dbCount = await prisma.ycParticipant.count({ where: { isComitee: false } })
  console.log(`Done. manifest=${peserta.length}, DB peserta=${dbCount}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
