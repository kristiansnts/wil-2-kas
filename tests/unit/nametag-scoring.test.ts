import { describe, expect, it } from 'vitest'
import { pointsFromCharCount } from '@/lib/yc/nametag-scoring'
import { YC_NAMETAG_MIN_CHARS } from '@/lib/yc/constants'

describe('pointsFromCharCount', () => {
  it('returns 0 below minimum chars', () => {
    expect(pointsFromCharCount(YC_NAMETAG_MIN_CHARS - 1)).toBe(0)
  })

  it('returns 50 at minimum chars', () => {
    expect(pointsFromCharCount(YC_NAMETAG_MIN_CHARS)).toBe(50)
  })

  it('adds 25 per extra 50 chars', () => {
    expect(pointsFromCharCount(100)).toBe(75)
    expect(pointsFromCharCount(150)).toBe(100)
  })

  it('caps at 150 points', () => {
    expect(pointsFromCharCount(500)).toBe(150)
  })
})
