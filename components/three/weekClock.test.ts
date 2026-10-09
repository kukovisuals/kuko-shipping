import { describe, expect, it } from 'vitest'
import { advance, beadFrame, dayOf, DAY_SECONDS, HOLD, WEEK } from './weekClock'

describe('weekClock', () => {
  const ages = [8, 10, 12, 14]
  const frame = (age: number, t: number) => beadFrame(age, 8, 14, t)

  it('ends exactly on the still map: every late bead at rest in its slot', () => {
    for (const age of ages) expect(frame(age, WEEK)).toEqual({ along: 1, scale: 1 })
  })

  it('starts with only the oldest day on its way', () => {
    expect(frame(14, 0).scale).toBe(1)
    expect(frame(8, 0).scale).toBe(0)
  })

  it('older orders leave before newer ones', () => {
    const t = 3
    expect(frame(14, t).along).toBeGreaterThan(frame(11, t).along)
    expect(frame(11, t).along).toBeGreaterThan(frame(8, t).along)
  })

  it('moves forward only, and wraps after the hold', () => {
    let last = -1
    for (let t = 0; t <= WEEK; t += 0.1) {
      const a = frame(10, t).along
      expect(a).toBeGreaterThanOrEqual(last)
      last = a
    }
    expect(advance(1, DAY_SECONDS)).toBeCloseTo(2)
    expect(advance(WEEK + HOLD - 0.01, DAY_SECONDS)).toBe(0)
  })

  it('names the day, Monday to Sunday', () => {
    expect([0, 0.9, 1, 6.5, WEEK, WEEK + HOLD].map(dayOf)).toEqual([0, 0, 1, 6, 6, 6])
  })

  it('copes with every late bead being the same age', () => {
    expect(beadFrame(9, 9, 9, 0)).toEqual({ along: 0, scale: 1 })
  })
})
