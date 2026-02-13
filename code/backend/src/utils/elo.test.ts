import { describe, expect, test } from 'bun:test'
import { calculateElo, getExpectedTier } from './elo'

// AUDIT FIX: Add automated coverage for core ELO logic

describe('elo', () => {
  test('winner gains and loser loses symmetric points', () => {
    const result = calculateElo(1400, 1400, 1)
    expect(result.changeA).toBeGreaterThan(0)
    expect(result.changeB).toBeLessThan(0)
    expect(result.changeA + result.changeB).toBe(0)
  })

  test('expected tier mapping', () => {
    expect(getExpectedTier(1199)).toBe('ranked_bronze')
    expect(getExpectedTier(1200)).toBe('ranked_silver')
    expect(getExpectedTier(1800)).toBe('ranked_legend')
  })
})
