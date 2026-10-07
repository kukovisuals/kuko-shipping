// API tests (wiki 08). They read the seeded database, so run `npm run db:seed` and `npm run engine` first
// (docker start tracker-db). They check shape and agreement between endpoints, not typed-in counts.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { db } from '../../lib/db'
import { REGIONS } from '../../lib/regions'
import { GET as getSummary } from './summary/route'
import { GET as getPipeline } from './pipeline/route'
import { GET as getLanes } from './lanes/route'
import { GET as getLate } from './regions/[region]/late/route'

const regionIds = REGIONS.map((r) => r.id)

async function lateRequest(region: string, query = '') {
  const res = await getLate(new Request(`http://test/api/regions/${region}/late${query}`), {
    params: Promise.resolve({ region }),
  })
  return { status: res.status, body: await res.json() }
}

let summary: Awaited<ReturnType<typeof readSummary>>
async function readSummary() {
  return (await getSummary()).json()
}

beforeAll(async () => {
  const processed = await db.order.count({ where: { region: { not: null } } })
  if (processed === 0) throw new Error('No processed orders. Run `npm run db:seed` then `npm run engine`.')
  summary = await readSummary()
})

afterEach(() => vi.restoreAllMocks())
afterAll(() => db.$disconnect())

describe('GET /api/summary', () => {
  it('returns the documented shape, regions in display order', () => {
    expect(summary.regions.map((r: { id: string }) => r.id)).toEqual(regionIds)
    expect(summary.regions.map((r: { name: string }) => r.name)).toEqual(REGIONS.map((r) => r.name))
    expect(new Date(summary.computedAt).toISOString()).toBe(summary.computedAt)
    for (const r of summary.regions) {
      expect(r).toEqual({ id: expect.any(String), name: expect.any(String), count: expect.any(Number), onTime: expect.any(Number), late: expect.any(Number) })
    }
  })

  it('adds up: total = sum of regions, on time + late = count (no at-risk in v1)', () => {
    const sum = (key: 'count' | 'onTime' | 'late') =>
      summary.regions.reduce((n: number, r: Record<string, number>) => n + r[key], 0)
    expect(summary.total).toEqual({ count: sum('count'), onTime: sum('onTime'), late: sum('late') })
    for (const r of summary.regions) expect(r.onTime + r.late).toBe(r.count)
  })

  it('counts every processed order', async () => {
    expect(summary.total.count).toBe(await db.order.count({ where: { region: { not: null } } }))
  })
})

describe('GET /api/pipeline', () => {
  it('returns the documented shape', async () => {
    const body = await (await getPipeline()).json()
    expect(Object.keys(body).sort()).toEqual(['backorder', 'computedAt', 'inTransit', 'ordered', 'packed'])
    for (const key of ['ordered', 'backorder', 'packed']) {
      expect(Object.keys(body[key]).sort()).toEqual([...regionIds].sort())
    }
    expect(Number.isInteger(body.inTransit)).toBe(true)
  })

  it('agrees with the summary, and Ordered - Backorder = Packed in every region', async () => {
    const body = await (await getPipeline()).json()
    for (const r of summary.regions) {
      expect(body.ordered[r.id]).toBe(r.count)
      expect(body.ordered[r.id] - body.backorder[r.id]).toBe(body.packed[r.id])
    }
    const delivered = await db.order.count({ where: { stage: 'DELIVERED' } })
    expect(body.inTransit).toBe(await db.order.count({ where: { stage: 'IN_TRANSIT' } }))
    expect(body.inTransit + delivered).toBeLessThanOrEqual(regionIds.reduce((n, id) => n + body.packed[id], 0))
  })
})

describe('GET /api/lanes', () => {
  it('lists warehouses and straight lanes from a known warehouse', async () => {
    const body = await (await getLanes()).json()
    expect(body.warehouses.length).toBeGreaterThan(0)
    expect(body.warehouses[0]).toEqual({ id: expect.any(String), name: expect.any(String), city: expect.any(String), lat: expect.any(Number), lng: expect.any(Number) })
    expect(body.lanes.length).toBeGreaterThan(0)

    const ids = new Set(body.warehouses.map((w: { id: string }) => w.id))
    const warehouse = new Map(body.warehouses.map((w: { id: string; lat: number; lng: number }) => [w.id, w]))
    for (const lane of body.lanes) {
      expect(ids.has(lane.warehouseId)).toBe(true)
      expect(regionIds).toContain(lane.region)
      expect(['ON_TIME', 'AT_RISK', 'LATE']).toContain(lane.timing)
      expect(lane.shipments).toBeGreaterThanOrEqual(1)
      expect(lane.points).toHaveLength(2)
      expect(lane.points[0]).toEqual({ lat: (warehouse.get(lane.warehouseId) as { lat: number }).lat, lng: (warehouse.get(lane.warehouseId) as { lng: number }).lng })
      expect(lane.destinations).toEqual([{ ...lane.points[1], city: expect.any(String) }])
    }
    expect(new Set(body.lanes.map((l: { id: string }) => l.id)).size).toBe(body.lanes.length)
  })

  it('carries every open shipment exactly once', async () => {
    const body = await (await getLanes()).json()
    const onLanes = body.lanes.reduce((n: number, l: { shipments: number }) => n + l.shipments, 0)
    const open = await db.shipment.count({
      where: { order: { region: { not: null }, stage: { in: ['ORDERED', 'BACKORDER', 'PACKED', 'IN_TRANSIT'] } } },
    })
    expect(onLanes).toBe(open)
  })
})

describe('GET /api/regions/[region]/late', () => {
  it('returns the late list, most late first, and how many are left', async () => {
    for (const r of summary.regions) {
      const { status, body } = await lateRequest(r.id)
      expect(status).toBe(200)
      expect(body.region).toBe(r.id)
      expect(body.lateCount).toBe(r.late)
      expect(body.orders.length).toBe(Math.min(6, r.late))
      expect(body.remaining).toBe(r.late - body.orders.length)
      const days = body.orders.map((o: { daysLate: number }) => o.daysLate)
      expect(days).toEqual([...days].sort((a, b) => b - a))
      for (const o of body.orders) {
        expect(o).toEqual({ name: expect.stringMatching(/^#/), city: expect.any(String), daysLate: expect.any(Number) })
        expect(o.daysLate).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('honours ?limit= and accepts a lower-case region', async () => {
    const west = summary.regions.find((r: { id: string }) => r.id === 'WEST')
    const { body } = await lateRequest('west', '?limit=2')
    expect(body.region).toBe('WEST')
    expect(body.orders).toHaveLength(Math.min(2, west.late))
    expect(body.remaining).toBe(west.late - body.orders.length)
  })

  it('answers 400 for an unknown region or a bad limit', async () => {
    for (const [region, query] of [['ATLANTIS', ''], ['WEST', '?limit=0'], ['WEST', '?limit=abc'], ['WEST', '?limit=101']]) {
      const { status, body } = await lateRequest(region, query)
      expect(status).toBe(400)
      expect(body.error).toEqual(expect.any(String))
    }
  })
})

describe('errors', () => {
  it('answers 500 with { error } when the database fails', async () => {
    vi.spyOn(db.order, 'groupBy').mockRejectedValue(new Error('db down'))
    const res = await getSummary()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'db down' })
  })
})
