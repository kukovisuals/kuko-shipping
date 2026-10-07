// The six seed invariants (wiki 06). Runs the real engine over the generated data and
// compares to the targets in seed.config.ts. The seed refuses to write if any fail.

import { regionForState, type Region } from '../lib/regions'
import { computeStatus, type LateRule, type Stage, type StatusOutput } from '../lib/status-engine'
import type { SeedData } from './seed.generate'
import type { SeedConfig } from './seed.config'

const REGIONS: Region[] = ['WEST', 'MIDWEST', 'NE', 'SOUTH']
const US_BOUNDS = { minLat: 18, maxLat: 72, minLng: -180, maxLng: -66 }

export function engineOutputs(data: SeedData, now: Date, lateRule: LateRule): Map<string, StatusOutput> {
  const events = new Map<string, { status: string; at: number }>()
  for (const e of data.events) {
    const prev = events.get(e.shipmentId)
    if (!prev || e.happenedAt.getTime() > prev.at) {
      events.set(e.shipmentId, { status: e.status, at: e.happenedAt.getTime() })
    }
  }
  const out = new Map<string, StatusOutput>()
  for (const order of data.orders) {
    const shipments = data.shipments
      .filter((s) => s.orderId === order.id)
      .map((s) => ({
        inTransitAt: s.inTransitAt,
        estimatedDeliveryAt: s.estimatedDeliveryAt,
        deliveredAt: s.deliveredAt,
        latestEventStatus: events.get(s.id)?.status ?? null,
      }))
    out.set(order.id, computeStatus({ order, shipments, now }, lateRule))
  }
  return out
}

// Returns a list of failure messages. Empty list = all six invariants hold.
export function checkInvariants(data: SeedData, config: SeedConfig, now: Date, lateRule: LateRule): string[] {
  const failures: string[] = []
  const fail = (n: number, msg: string) => failures.push(`Invariant ${n}: ${msg}`)
  const status = engineOutputs(data, now, lateRule)
  const results = [...status.values()]
  const inRegion = (r: Region) => results.filter((o) => o.region === r)

  for (const r of REGIONS) {
    const t = config.regions[r]
    const rows = inRegion(r)
    const count = (f: (o: StatusOutput) => boolean) => rows.filter(f).length

    // 1. Order count per region (and so in total).
    if (rows.length !== t.onTime + t.late) fail(1, `${r} has ${rows.length} orders, expected ${t.onTime + t.late}`)

    // 2. On time and late per region. The late list needs more than 6 rows to show "+ N more".
    const late = count((o) => o.timing === 'LATE')
    const onTime = count((o) => o.timing === 'ON_TIME')
    if (late !== t.late) fail(2, `${r} has ${late} late, expected ${t.late}`)
    if (onTime !== t.onTime) fail(2, `${r} has ${onTime} on time, expected ${t.onTime}`)
    if (late <= 6) fail(2, `${r} has only ${late} late; the late list needs more than 6`)

    // 4. Backorder per region, and Ordered - Backorder = Packed (nothing is stuck at plain Ordered).
    const stage = (s: Stage) => count((o) => o.stage === s)
    if (stage('BACKORDER') !== t.backorder) fail(4, `${r} has ${stage('BACKORDER')} backorder, expected ${t.backorder}`)
    const packedReached = stage('PACKED') + stage('IN_TRANSIT') + stage('DELIVERED')
    if (rows.length - stage('BACKORDER') !== packedReached) {
      fail(4, `${r}: ordered ${rows.length} - backorder ${stage('BACKORDER')} != packed ${packedReached}`)
    }
  }

  // 3. Every order has exactly one stage, and the stage counts add up to the order count.
  const byStage = new Map<Stage, number>()
  for (const o of results) byStage.set(o.stage, (byStage.get(o.stage) ?? 0) + 1)
  const stageSum = [...byStage.values()].reduce((a, b) => a + b, 0)
  if (status.size !== data.orders.length) fail(3, 'some order has no engine result')
  if (stageSum !== data.orders.length) fail(3, `stage counts add up to ${stageSum}, orders are ${data.orders.length}`)

  // 5. In-transit total, and shipments match stages (backorder has none; packed and in transit have one).
  const inTransitTarget = REGIONS.reduce((sum, r) => sum + config.regions[r].inTransit, 0)
  if ((byStage.get('IN_TRANSIT') ?? 0) !== inTransitTarget) {
    fail(5, `${byStage.get('IN_TRANSIT') ?? 0} in transit, expected ${inTransitTarget}`)
  }
  const shipmentsPerOrder = new Map<string, number>()
  for (const s of data.shipments) shipmentsPerOrder.set(s.orderId, (shipmentsPerOrder.get(s.orderId) ?? 0) + 1)
  for (const o of data.orders) {
    const expected = status.get(o.id)!.stage === 'BACKORDER' ? 0 : 1
    if ((shipmentsPerOrder.get(o.id) ?? 0) !== expected) fail(5, `${o.name} has the wrong number of shipments`)
  }

  // 6. Data sanity: one warehouse, unique names, valid states, US coordinates, no future events.
  const warehouseIds = new Set(data.locations.map((l) => l.id))
  if (new Set(data.orders.map((o) => o.name)).size !== data.orders.length) fail(6, 'order names are not unique')
  for (const o of data.orders) {
    if (!warehouseIds.has(o.assignedLocationId)) fail(6, `${o.name} has an unknown warehouse`)
    if (o.createdAt.getTime() > now.getTime()) fail(6, `${o.name} was created in the future`)
    try {
      regionForState(o.destinationState)
    } catch {
      fail(6, `${o.name} has unknown state ${o.destinationState}`)
    }
    const { minLat, maxLat, minLng, maxLng } = US_BOUNDS
    if (o.lat < minLat || o.lat > maxLat || o.lng < minLng || o.lng > maxLng) fail(6, `${o.name} is outside the US`)
  }
  for (const e of data.events) {
    if (e.happenedAt.getTime() > now.getTime()) fail(6, `event ${e.id} is in the future`)
  }
  for (const s of data.shipments) {
    if (!warehouseIds.has(s.locationId)) fail(6, `shipment ${s.id} has an unknown warehouse`)
  }

  return failures
}
