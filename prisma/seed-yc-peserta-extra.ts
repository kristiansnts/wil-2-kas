import 'dotenv/config'
import { mkdir } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { nanoid } from 'nanoid'
import { getDirectDatabaseUrl } from '../lib/database-url'
import { buildParticipantUrl, normalizeQrBaseUrl, resolveQrBaseUrl } from '../lib/yc/participant-url'
import {
  assertQrCardTemplate,
  generateQrCardJpeg,
  readQrManifest,
  writeQrManifest,
  type QrCardManifestEntry,
} from '../lib/yc/qr-card'

const EXTRA_COUNT = Number(process.argv[2]) || 20
const PESERTA_DIR = path.join(process.cwd(), 'public', 'qr', 'peserta')
const MANIFEST_PATH = path.join(process.cwd(), 'public', 'qr', 'manifest.json')

const adapter = new PrismaPg({ connectionString: getDirectDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

function padNum(n: number, width: number) {
  return String(n).padStart(width, '0')
}

async function main() {
  await assertQrCardTemplate()

  const manifest = await readQrManifest(MANIFEST_PATH)
  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())
  const lastNo =
    manifest.peserta.length > 0 ? Math.max(...manifest.peserta.map(p => p.no)) : 0

  const groups = await prisma.ycGroup.findMany({ orderBy: { slug: 'asc' } })
  if (groups.length === 0) {
    throw new Error('Belum ada kelompok. Jalankan npm run db:seed-yc dulu.')
  }

  const dbCount = await prisma.ycParticipant.count({ where: { isComitee: false } })
  if (dbCount !== manifest.peserta.length) {
    console.warn(
      `Peringatan: peserta DB (${dbCount}) ≠ manifest (${manifest.peserta.length}). ` +
        'Lanjut menambah berdasarkan nomor terakhir di manifest.',
    )
  }

  await mkdir(PESERTA_DIR, { recursive: true })

  const newEntries: QrCardManifestEntry[] = []
  const tokens: string[] = []

  console.log(`Menambah ${EXTRA_COUNT} peserta (#${lastNo + 1} … #${lastNo + EXTRA_COUNT})`)
  console.log(`Base URL: ${baseUrl}`)

  for (let i = 0; i < EXTRA_COUNT; i++) {
    const no = lastNo + i + 1
    const token = nanoid(16)
    tokens.push(token)
    const url = buildParticipantUrl(baseUrl, token)
    const filename = `${padNum(no, 3)}.jpg`
    const file = `/qr/peserta/${filename}`
    const outPath = path.join(PESERTA_DIR, filename)

    await generateQrCardJpeg(url, outPath)
    newEntries.push({ no, token, url, file, cardFile: file })
    console.log(`  #${no}: ${token} → ${file}`)
  }

  await prisma.ycParticipant.createMany({
    data: tokens.map((token, i) => ({
      token,
      isComitee: false,
      groupId: groups[(lastNo + i) % groups.length].id,
    })),
  })

  const peserta = [...manifest.peserta, ...newEntries]
  await writeQrManifest(MANIFEST_PATH, {
    ...manifest,
    baseUrl,
    generatedAt: new Date().toISOString(),
    template: manifest.template ?? '/qr/1000344557.jpg',
    peserta,
  })

  console.log(`Selesai. Total peserta: ${peserta.length}`)
  console.log(
    `Kartu: public/qr/peserta/${padNum(lastNo + 1, 3)}.jpg … ${padNum(lastNo + EXTRA_COUNT, 3)}.jpg`,
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
