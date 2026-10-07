import { describe, expect, it } from 'vitest'
import { spread } from './spread'

describe('spread', () => {
  it('leaves values that are already apart alone', () => {
    expect(spread([0, 20, 50], 10)).toEqual([0, 20, 50])
  })

  it('pushes close values apart, keeping their order', () => {
    const out = spread([30, 0, 2, 4], 10)
    const sorted = [...out].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(10 - 1e-6)
    expect(out[1]).toBeLessThan(out[2])
    expect(out[2]).toBeLessThan(out[3])
  })

  it('handles identical values and empty input', () => {
    const out = spread([5, 5, 5], 4)
    expect(new Set(out).size).toBe(3)
    expect(spread([], 4)).toEqual([])
  })
})
