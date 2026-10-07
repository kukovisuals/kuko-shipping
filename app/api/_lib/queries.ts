// Read-only queries behind the API routes. They count and list the derived fields the
// engine wrote; none of them decides a stage, timing, or region (architecture rule 1).

import { db } from '../../../lib/db'
import { REGIONS, type Region } from '../../../lib/regions'

// Orders the engine has not processed yet have no region, and are left out of every endpoint.
const PROCESSED = { region: { not: null } } as const

const MAX_LIMIT = 100
export const DEFAULT_LATE_LIMIT = 6

type ByRegion = Record<Region, number>

function byRegion(): ByRegion {
  return { WEST: 0, MIDWEST: 0, NE: 0, SOUTH: 0 }
}

// Freshness of the data: the newest time the engine wrote any order. Null if it never ran.
async function latestComputedAt(): Promise<string | null> {
  const { _max } = await db.order.aggregate({ _max: { computedAt: true } })
  return _max.computedAt?.toISOString() ?? null
}

export async function getSummary() {
  const [groups, computedAt] = await Promise.all([
    db.order.groupBy({ by: ['region', 'timing'], where: PROCESSED, _count: { _all: true } }),
    latestComputedAt(),
  ])

  const regions = REGIONS.map(({ id, name }) => {
    const count = (timing?: string) =>
      groups
        .filter((g) => g.region === id && (timing === undefined || g.timing === timing))
        .reduce((sum, g) => sum + g._count._all, 0)
    return { id, name, count: count(), onTime: count('ON_TIME'), late: count('LATE') }
  })

  const sum = (key: 'count' | 'onTime' | 'late') => regions.reduce((total, r) => total + r[key], 0)
  return {
    computedAt,
    total: { count: sum('count'), onTime: sum('onTime'), late: sum('late') },
    regions,
  }
}

// ordered   = every order in the region
// backorder = orders on hold for stock
// packed    = orders that reached Packed (Packed + In transit + Delivered), so Ordered - Backorder = Packed
// inTransit = orders in transit right now, all regions
export async function getPipeline() {
  const [groups, computedAt] = await Promise.all([
    db.order.groupBy({ by: ['region', 'stage'], where: PROCESSED, _count: { _all: true } }),
    latestComputedAt(),
  ])

  const ordered = byRegion()
  const backorder = byRegion()
  const packed = byRegion()
  let inTransit = 0

  for (const { region, stage, _count } of groups) {
    if (region === null) continue
    const n = _count._all
    ordered[region] += n
    if (stage === 'BACKORDER') backorder[region] += n
    if (stage === 'PACKED' || stage === 'IN_TRANSIT' || stage === 'DELIVERED') packed[region] += n
    if (stage === 'IN_TRANSIT') inTransit += n
  }
  return { computedAt, ordered, backorder, packed, inTransit }
}

// OPEN-03: one straight line from a warehouse to each destination city. Lanes are split by timing,
// so a lane's colour is one thing; `shipments` is how many shipments (dots, OPEN-06) ride it.
// Delivered orders are left out: lanes show what is still on its way.
export async function getLanes() {
  const [warehouses, shipments, computedAt] = await Promise.all([
    db.location.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
    db.shipment.findMany({
      where: { order: { ...PROCESSED, stage: { in: ['ORDERED', 'BACKORDER', 'PACKED', 'IN_TRANSIT'] } } },
      select: {
        locationId: true,
        order: {
          select: { destinationCity: true, destinationState: true, lat: true, lng: true, region: true, timing: true },
        },
      },
    }),
    latestComputedAt(),
  ])

  const origin = new Map(warehouses.map((w) => [w.id, { lat: w.lat, lng: w.lng }]))
  type Lane = {
    id: string
    warehouseId: string
    region: Region
    timing: NonNullable<(typeof shipments)[number]['order']['timing']>
    shipments: number
    points: { lat: number; lng: number }[]
    destinations: { lat: number; lng: number; city: string }[]
  }
  const lanes = new Map<string, Lane>()

  for (const { locationId, order } of shipments) {
    const from = origin.get(locationId)
    if (!from || order.region === null || order.timing === null) continue
    const id = `lane-${locationId}-${order.destinationState}-${order.destinationCity}-${order.timing}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    const lane = lanes.get(id)
    if (lane) {
      lane.shipments += 1
      continue
    }
    const to = { lat: order.lat, lng: order.lng }
    lanes.set(id, {
      id,
      warehouseId: locationId,
      region: order.region,
      timing: order.timing,
      shipments: 1,
      points: [from, to],
      destinations: [{ ...to, city: order.destinationCity }],
    })
  }

  return {
    computedAt,
    warehouses: warehouses.map(({ id, name, city, lat, lng }) => ({ id, name, city, lat, lng })),
    lanes: [...lanes.values()].sort((a, b) => a.id.localeCompare(b.id)),
  }
}

// The most-late orders first, so the list opens on the worst of them.
export async function getLateOrders(region: Region, limit: number) {
  const where = { region, timing: 'LATE' } as const
  const [lateCount, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: [{ daysLate: 'desc' }, { name: 'asc' }],
      take: limit,
      select: { name: true, destinationCity: true, daysLate: true },
    }),
  ])
  const orders = rows.map((o) => ({ name: o.name, city: o.destinationCity, daysLate: o.daysLate ?? 0 }))
  return { region, lateCount, orders, remaining: lateCount - orders.length }
}

// Reads ?limit=. Absent means the default; anything but a whole number from 1 to 100 is a 400.
export function parseLimit(raw: string | null): number | null {
  if (raw === null) return DEFAULT_LATE_LIMIT
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  return n >= 1 && n <= MAX_LIMIT ? n : null
}
