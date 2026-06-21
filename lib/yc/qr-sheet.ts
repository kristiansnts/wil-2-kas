import { access, readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { padQrCardNum, type QrCardManifestEntry } from './qr-card'

/** A3 portrait @ 300 DPI — physical card 5.4 × 8.4 cm, 5×5 grid. */
export const A3_SHEET_DPI = 300
export const A3_WIDTH_MM = 297
export const A3_HEIGHT_MM = 420
export const CARD_WIDTH_MM = 54
export const CARD_HEIGHT_MM = 84
export const SHEET_COLS = 5
export const SHEET_ROWS = 5
export const CARDS_PER_SHEET = SHEET_COLS * SHEET_ROWS

export function mmToPx(mm: number, dpi = A3_SHEET_DPI): number {
  return Math.round((mm / 25.4) * dpi)
}

export const A3_WIDTH_PX = mmToPx(A3_WIDTH_MM)
export const A3_HEIGHT_PX = mmToPx(A3_HEIGHT_MM)
export const CARD_WIDTH_PX = mmToPx(CARD_WIDTH_MM)
export const CARD_HEIGHT_PX = mmToPx(CARD_HEIGHT_MM)
export const SHEET_MARGIN_LEFT = Math.round((A3_WIDTH_PX - SHEET_COLS * CARD_WIDTH_PX) / 2)
export const SHEET_MARGIN_TOP = Math.round((A3_HEIGHT_PX - SHEET_ROWS * CARD_HEIGHT_PX) / 2)

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function cutLinesSvg(): Buffer {
  const w = A3_WIDTH_PX
  const h = A3_HEIGHT_PX
  const x0 = SHEET_MARGIN_LEFT
  const y0 = SHEET_MARGIN_TOP
  const lines: string[] = []

  for (let c = 0; c <= SHEET_COLS; c++) {
    const x = x0 + c * CARD_WIDTH_PX
    lines.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + SHEET_ROWS * CARD_HEIGHT_PX}" stroke="#cccccc" stroke-width="1"/>`)
  }
  for (let r = 0; r <= SHEET_ROWS; r++) {
    const y = y0 + r * CARD_HEIGHT_PX
    lines.push(`<line x1="${x0}" y1="${y}" x2="${x0 + SHEET_COLS * CARD_WIDTH_PX}" y2="${y}" stroke="#cccccc" stroke-width="1"/>`)
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`
  return Buffer.from(svg)
}

async function resizeCardBuffer(source: Buffer): Promise<Buffer> {
  return sharp(source)
    .resize(CARD_WIDTH_PX, CARD_HEIGHT_PX, { fit: 'fill' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()
}

function cardFilePath(entry: QrCardManifestEntry, padWidth: number, cardsSubdir: string): string {
  if (entry.cardFile) {
    return path.join(process.cwd(), 'public', entry.cardFile.replace(/^\//, ''))
  }
  return path.join(
    process.cwd(),
    'public',
    'qr',
    'cards',
    cardsSubdir,
    `${padQrCardNum(entry.no, padWidth)}.jpg`,
  )
}

export async function buildCardCell(
  entry: QrCardManifestEntry,
  padWidth: number,
  cardsSubdir: string,
): Promise<Buffer> {
  const cardPath = cardFilePath(entry, padWidth, cardsSubdir)
  if (!(await fileExists(cardPath))) {
    throw new Error(`Kartu nametag tidak ditemukan: ${cardPath}`)
  }
  return resizeCardBuffer(await readFile(cardPath))
}

export async function composeA3Sheet(cells: Buffer[], drawCutLines = true): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = cells.map((cell, index) => {
    const col = index % SHEET_COLS
    const row = Math.floor(index / SHEET_COLS)
    return {
      input: cell,
      left: SHEET_MARGIN_LEFT + col * CARD_WIDTH_PX,
      top: SHEET_MARGIN_TOP + row * CARD_HEIGHT_PX,
    }
  })

  if (drawCutLines) {
    composites.push({ input: cutLinesSvg(), left: 0, top: 0 })
  }

  return sharp({
    create: {
      width: A3_WIDTH_PX,
      height: A3_HEIGHT_PX,
      channels: 3,
      background: '#ffffff',
    },
  })
    .composite(composites)
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer()
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function buildBlankCell(): Promise<Buffer> {
  return sharp({
    create: {
      width: CARD_WIDTH_PX,
      height: CARD_HEIGHT_PX,
      channels: 3,
      background: '#ffffff',
    },
  })
    .jpeg({ quality: 92 })
    .toBuffer()
}
