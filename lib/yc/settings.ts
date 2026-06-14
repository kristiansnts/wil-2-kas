import { prisma } from '@/lib/prisma'
import { YC_DEFAULT_PDFS, YC_SETTING_KEYS } from './constants'

/** Ubah link Google Drive /view atau ?id= ke /preview agar bisa di-iframe. */
export function toEmbeddablePdfUrl(url: string): string {
  const trimmed = url.trim()
  const fileIdMatch =
    trimmed.match(/\/file\/d\/([^/]+)/) ?? trimmed.match(/[?&]id=([^&]+)/)
  if (fileIdMatch && trimmed.includes('drive.google.com')) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
  }
  return trimmed
}

export async function getYcSetting(key: string): Promise<string | null> {
  const row = await prisma.ycSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setYcSetting(key: string, value: string): Promise<void> {
  await prisma.ycSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export async function getRundownPdfUrl(): Promise<string> {
  const custom = await getYcSetting(YC_SETTING_KEYS.rundownPdfUrl)
  return toEmbeddablePdfUrl(custom || YC_DEFAULT_PDFS.rundown)
}

export async function getKamarPdfUrl(): Promise<string> {
  const custom = await getYcSetting(YC_SETTING_KEYS.kamarPdfUrl)
  return toEmbeddablePdfUrl(custom || YC_DEFAULT_PDFS.kamar)
}
