// Must-pass checks 1 to 3 (wiki 13), run against the seeded database through the real route handlers.
// Checks 4 to 6 are in e2e/must-pass.spec.ts; check 7 is manual (wiki 13).
// Needs `npm run db:seed` then `npm run engine` (docker start tracker-db).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../lib/db'
import { REGIONS } from '../lib/regions'
import { GET as getSummary } from '../app/api/summary/route'
import { GET as getPipeline } from '../app/api/pipeline/route'
import { SEED_CONFIG } from '../prisma/seed.config'

type Counts = { id: string; count: number; onTime: number; late: number }
let summary: { total: Omit<Counts, 'id'>; regions: Counts[] }
let pipeline: Record<'ordered' | 'backorder' | 'packed', Record<string, number>> & { inTransit: number }

beforeAll(async () => {
  summary = await (await getSummary()).json()
  pipeline = await (await getPipeline()).json()
  if (summary.total.count === 0) throw new Error('No processed orders. Run `npm run db:seed` then `npm run engine`.')
})
afterAll(() => db.$disconnect())

const target = (id: string) => SEED_CONFIG.regions[id as keyof typeof SEED_CONFIG.regions]
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('must-pass 1: engine output on the seed = the Seed Data table, number for number', () => {
  // The expected numbers come from prisma/seed.config.ts, the one place they are typed (wiki 06).
  // If this fails right after a fresh seed and engine run, the engine or the seed is wrong; if the
  // data is old, re-seed and re-run the engine (late counts depend on the clock).
  it.each(REGIONS.map((r) => r.id))('%s: orders, on time, late, backorder, packed', (id) => {
    const t = target(id)
    const row = summary.regions.find((r) => r.id === id)!
    expect(row).toMatchObject({ count: t.onTime + t.late, onTime: t.onTime, late: t.late })
    expect(pipeline.ordered[id]).toBe(t.onTime + t.late)
    expect(pipeline.backorder[id]).toBe(t.backorder)
    expect(pipeline.packed[id]).toBe(t.onTime + t.late - t.backorder)
  })

  it('all regions together: total, late, and in transit', () => {
    const all = Object.values(SEED_CONFIG.regions)
    expect(summary.total).toEqual({
      count: sum(all.map((t) => t.onTime + t.late)),
      onTime: sum(all.map((t) => t.onTime)),
      late: sum(all.map((t) => t.late)),
    })
    expect(pipeline.inTransit).toBe(sum(all.map((t) => t.inTransit)))
  })
})

describe('must-pass 2: Ordered - Backorder = Packed, for every region', () => {
  it.each(REGIONS.map((r) => r.id))('%s', (id) => {
    expect(pipeline.ordered[id] - pipeline.backorder[id]).toBe(pipeline.packed[id])
  })
})

describe('must-pass 3: Total = sum of regions', () => {
  it('count, on time and late', () => {
    for (const key of ['count', 'onTime', 'late'] as const) {
      expect(summary.total[key]).toBe(sum(summary.regions.map((r) => r[key])))
    }
  })
})
