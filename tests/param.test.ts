import { describe, expect, it } from 'vitest'
import { parsePositiveInt } from '@/lib/param'

describe('parsePositiveInt', () => {
  it('returns number for valid positive integer string', () => {
    expect(parsePositiveInt('1', 'product')).toBe(1)
    expect(parsePositiveInt('999', 'order')).toBe(999)
  })

  it('throws for non-numeric string', () => {
    expect(() => parsePositiveInt('abc', 'product')).toThrow('Invalid product')
    expect(() => parsePositiveInt('12.5', 'order')).toThrow('Invalid order')
  })

  it('throws for zero', () => {
    expect(() => parsePositiveInt('0', 'product')).toThrow('Invalid product')
  })

  it('throws for negative', () => {
    expect(() => parsePositiveInt('-1', 'order')).toThrow('Invalid order')
  })

  it('throws for NaN', () => {
    expect(() => parsePositiveInt('NaN', 'product')).toThrow('Invalid product')
  })

  it('throws for empty string', () => {
    expect(() => parsePositiveInt('', 'product')).toThrow('Invalid product')
  })

  it('uses the provided name in error message', () => {
    expect(() => parsePositiveInt('bad', 'widget')).toThrow('Invalid widget')
  })
})
