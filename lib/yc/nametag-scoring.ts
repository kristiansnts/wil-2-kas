import { YC_NAMETAG_MIN_CHARS } from './constants'

/** Points from story length: 50 base at 50 chars, +25 per extra 50 chars, cap 150. */
export function pointsFromCharCount(chars: number): number {
  if (chars < YC_NAMETAG_MIN_CHARS) return 0
  const bucket = Math.floor((chars - YC_NAMETAG_MIN_CHARS) / 50)
  return Math.min(150, 50 + bucket * 25)
}
