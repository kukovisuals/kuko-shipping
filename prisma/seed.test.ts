import { describe, expect, it } from 'vitest'
import type { Region } from '../lib/regions'
import { SEED_CONFIG } from './seed.config'
import { generateSeed } from './seed.generate'
import { checkInvariants, engineOutputs } from './seed.invariants'

const NOW = new Date('2026-10-07T14:00:00Z')
const HOUR = 60 * 60 * 1000
const REGIONS = Object.keys(SEED_CONFIG.regions) as Region[]

describe('seed invariants', () => {
  const data = generateSeed(NOW)

  it.each(['A', 'B'] as const)('all six hold under late rule %s', (rule) => {
    expect(checkInvariants(data, SEED_CONFIG, NOW, rule)).toEqual([])
  })

  it('still holds 12 hours later (same engine run, later clock)', () => {
    const later = new Date(NOW.getTime() + 12 * HOUR)
    expect(checkInvariants(data, SEED_CONFIG, later, 'B')).toEqual([])
  })

  it('order total equals the sum of the region targets', () => {
    const target = REGIONS.reduce((s, r) => s + SEED_CONFIG.regions[r].onTime + SEED_CONFIG.regions[r].late, 0)
    expect(data.orders).toHaveLength(target)
  })

  it('late orders per region, taken from the engine, match the config', () => {
    const out = [...engineOutputs(data, NOW, 'B').values()]
    for (const r of REGIONS) {
      expect(out.filter((o) => o.region === r && o.timing === 'LATE')).toHaveLength(SEED_CONFIG.regions[r].late)
    }
  })

  it('is deterministic: same seed and time give the same data', () => {
    expect(generateSeed(NOW)).toEqual(data)
  })

  it('writes raw fields only', () => {
    for (const o of data.orders) {
      expect(o).not.toHaveProperty('stage')
      expect(o).not.toHaveProperty('timing')
      expect(o).not.toHaveProperty('daysLate')
      expect(o).not.toHaveProperty('region')
    }
  })

  it('uses one warehouse, as in v1 (D-009)', () => {
    expect(data.locations).toHaveLength(1)
  })
})

describe('the invariants catch broken data', () => {
  const fresh = () => generateSeed(NOW)

  it('a missing order breaks invariants 1, 2 and 3', () => {
    const data = fresh()
    data.orders.pop()
    expect(checkInvariants(data, SEED_CONFIG, NOW, 'B').length).toBeGreaterThan(0)
  })

  it('an on-time order made old breaks the late count', () => {
    const data = fresh()
    const status = engineOutputs(data, NOW, 'B')
    const victim = data.orders.find((o) => status.get(o.id)!.timing === 'ON_TIME')!
    victim.createdAt = new Date(NOW.getTime() - 20 * 24 * HOUR)
    expect(checkInvariants(data, SEED_CONFIG, NOW, 'B').join('\n')).toMatch(/Invariant 2/)
  })

  it('a duplicate order name breaks invariant 6', () => {
    const data = fresh()
    data.orders[1].name = data.orders[0].name
    expect(checkInvariants(data, SEED_CONFIG, NOW, 'B').join('\n')).toMatch(/Invariant 6/)
  })

  it('a changed target breaks the check', () => {
    const data = fresh()
    const config = { ...SEED_CONFIG, regions: { ...SEED_CONFIG.regions, WEST: { ...SEED_CONFIG.regions.WEST, backorder: 1 } } }
    expect(checkInvariants(data, config, NOW, 'B').join('\n')).toMatch(/Invariant 4/)
  })
})
