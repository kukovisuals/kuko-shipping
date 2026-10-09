import { describe, expect, it } from 'vitest'
import { advance, beadFrame, dayOf, DAY_SECONDS, HOLD, WEEK } from './weekClock'

describe('weekClock', () => {
  const ages = [0, 3, 7, 10, 14]

  it('ends exactly on the still map: late beads at rest, on-time beads gone', () => {
    for (const age of ages) {
      expect(beadFrame(age, 14, true, WEEK)).toEqual({ along: 1, scale: 1, fade: 0 })
      expect(beadFrame(age, 14, false, WEEK).scale).toBe(0)
    }
  })

  it('starts empty: nothing has left yet except the oldest day', () => {
    expect(beadFrame(0, 14, true, 0).scale).toBe(0)
    expect(beadFrame(14, 14, true, 0).scale).toBe(1)
  })

  it('older orders leave before newer ones', () => {
    const t = 3
    expect(beadFrame(14, 14, true, t).along).toBeGreaterThan(beadFrame(7, 14, true, t).along)
    expect(beadFrame(7, 14, true, t).along).toBeGreaterThan(beadFrame(0, 14, true, t).along)
  })

  it('an on-time bead fades after it arrives, a late bead never does', () => {
    expect(beadFrame(14, 14, false, 3).fade).toBeGreaterThan(0)
    expect(beadFrame(14, 14, true, 3).fade).toBe(0)
  })

  it('moves forward only, and wraps after the hold', () => {
    let last = -1
    for (let t = 0; t <= WEEK; t += 0.1) {
      const a = beadFrame(5, 14, true, t).along
      expect(a).toBeGreaterThanOrEqual(last)
      last = a
    }
    expect(advance(1, DAY_SECONDS)).toBeCloseTo(2)
    expect(advance(WEEK + HOLD - 0.01, DAY_SECONDS)).toBe(0)
  })

  it('names the day, Monday to Sunday', () => {
    expect([0, 0.9, 1, 6.5, WEEK, WEEK + HOLD].map(dayOf)).toEqual([0, 0, 1, 6, 6, 6])
  })

  it('copes with a lane set that has only today', () => {
    expect(beadFrame(0, 0, true, 0)).toEqual({ along: 0, scale: 1, fade: 0 })
  })
})
