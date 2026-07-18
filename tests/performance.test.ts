import { describe, expect, it } from 'vitest'
import { elapsedMs, getThresholdMs, startTimer } from '@/lib/performance'

describe('performance helpers', () => {
  it('returns a numeric elapsed duration', () => {
    const start = startTimer()
    const durationMs = elapsedMs(start)

    expect(typeof durationMs).toBe('number')
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })

  it('falls back to default threshold for invalid values', () => {
    expect(getThresholdMs(undefined, 100)).toBe(100)
    expect(getThresholdMs('0', 100)).toBe(100)
    expect(getThresholdMs('invalid', 100)).toBe(100)
    expect(getThresholdMs('25', 100)).toBe(25)
  })
})
