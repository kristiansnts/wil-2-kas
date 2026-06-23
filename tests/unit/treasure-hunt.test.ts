import { describe, expect, it } from 'vitest'
import { treasureHuntFragmentCode } from '@/lib/yc/treasure-hunt'

describe('treasureHuntFragmentCode', () => {
  it('pads order to two digits', () => {
    expect(treasureHuntFragmentCode(1)).toBe('yc-fragment-01')
    expect(treasureHuntFragmentCode(8)).toBe('yc-fragment-08')
  })
})
