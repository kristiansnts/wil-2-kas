import { describe, expect, it } from 'vitest'
import {
  getNextOpponentNum,
  isGuessCorrect,
  isValidOutboundPosition,
  teamSlugFromNum,
} from '@/lib/yc/outbound-data'

describe('outbound-data', () => {
  it('teamSlugFromNum', () => {
    expect(teamSlugFromNum(1)).toBe('team-1')
    expect(teamSlugFromNum(10)).toBe('team-10')
  })

  it('isValidOutboundPosition', () => {
    expect(isValidOutboundPosition(1)).toBe(true)
    expect(isValidOutboundPosition(5)).toBe(true)
    expect(isValidOutboundPosition(0)).toBe(false)
    expect(isValidOutboundPosition(6)).toBe(false)
  })

  it('getNextOpponentNum round 1 team 1 faces team 10', () => {
    expect(getNextOpponentNum(1, 0)).toBe(10)
  })

  it('isGuessCorrect', () => {
    expect(isGuessCorrect(10, 10)).toBe(true)
    expect(isGuessCorrect(9, 10)).toBe(false)
  })
})
