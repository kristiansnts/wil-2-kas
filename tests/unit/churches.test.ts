import { describe, expect, it } from 'vitest'
import { formatChurchLabel } from '@/lib/yc/churches'

describe('formatChurchLabel', () => {
  it('prefixes GPdI when missing', () => {
    expect(formatChurchLabel('Wilayah II')).toBe('GPdI Wilayah II')
  })

  it('keeps existing GPdI prefix', () => {
    expect(formatChurchLabel('GPdI Madiun')).toBe('GPdI Madiun')
  })
})
