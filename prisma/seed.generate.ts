// Builds the fake data (wiki 06). Pure: no database, no clock. Same config + same `now` = same data.
// Writes RAW fields only. Derived fields (region, stage, timing, daysLate) belong to the engine job.

import { regionForState, type Region } from '../lib/regions'
import { CITIES, type City } from './cities'
import { SEED_CONFIG, type SeedConfig } from './seed.config'

const DAY = 24 * 60 * 60 * 1000
const REGIONS: Region[] = ['WEST', 'MIDWEST', 'NE', 'SOUTH']

export type LocationRow = { id: string; name: string; city: string; state: string; lat: number; lng: number }
export type OrderRow = {
  id: string
  name: string
  createdAt: Date
  destinationCity: string
  destinationState: string
  lat: number
  lng: number
  displayFulfillmentStatus: string
  holdReason: string | null
  assignedLocationId: string
}
export type ShipmentRow = {
  id: string
  orderId: string
  locationId: string
  createdAt: Date
  inTransitAt: Date | null
  estimatedDeliveryAt: Date | null
  deliveredAt: Date | null
}
export type EventRow = { id: string; shipmentId: string; status: string; happenedAt: Date }
export type SeedData = {
  locations: LocationRow[]
  orders: OrderRow[]
  shipments: ShipmentRow[]
  events: EventRow[]
}

// Small seeded random generator (mulberry32).
function makeRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    between: (min: number, max: number) => min + next() * (max - min),
    shuffle<T>(items: T[]): T[] {
      const out = [...items]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
  }
}

function weightedPicker(cities: City[], next: () => number) {
  const total = cities.reduce((sum, c) => sum + c.weight, 0)
  return () => {
    let roll = next() * total
    for (const c of cities) {
      roll -= c.weight
      if (roll < 0) return c
    }
    return cities[cities.length - 1]
  }
}

type Plan = { region: Region; stage: 'BACKORDER' | 'PACKED' | 'IN_TRANSIT'; late: boolean }

export function generateSeed(now: Date, config: SeedConfig = SEED_CONFIG): SeedData {
  const rng = makeRng(config.randomSeed)
  const at = (ms: number) => new Date(ms)

  const warehouse: LocationRow = { id: 'loc-1', ...config.warehouse }

  // 1. Decide stage and lateness for every order, region by region.
  const plans: Plan[] = []
  for (const region of REGIONS) {
    const t = config.regions[region]
    const count = t.onTime + t.late
    const packed = count - t.backorder - t.inTransit
    if (packed < 0) throw new Error(`${region}: backorder + inTransit is more than the order count`)
    if (t.late > count - t.backorder) {
      // Backorder orders have no shipment, so rule A could never call them late.
      throw new Error(`${region}: late (${t.late}) cannot exceed orders that have shipped or are packed`)
    }
    const stages: Plan['stage'][] = [
      ...Array<Plan['stage']>(t.backorder).fill('BACKORDER'),
      ...Array<Plan['stage']>(t.inTransit).fill('IN_TRANSIT'),
      ...Array<Plan['stage']>(packed).fill('PACKED'),
    ]
    const withShipment = rng.shuffle(stages.filter((s) => s !== 'BACKORDER'))
    const lateStages = withShipment.slice(0, t.late) // these become the late ones
    const lateByStage = { PACKED: 0, IN_TRANSIT: 0, BACKORDER: 0 }
    for (const s of lateStages) lateByStage[s]++
    const lateLeft = { ...lateByStage }
    for (const stage of rng.shuffle(stages)) {
      const late = lateLeft[stage] > 0
      if (late) lateLeft[stage]--
      plans.push({ region, stage, late })
    }
  }

  // 2. Give each order an age. Late = 8 to 14 days old. On time = under 6.5 days.
  //    Margins keep it on the same side of the 7-day line for about 12 hours after seeding.
  const aged = plans.map((plan) => {
    const minAge = plan.stage === 'IN_TRANSIT' ? 2 : plan.stage === 'PACKED' ? 0.5 : 0.2
    const ageDays = plan.late ? rng.between(8, 14) : rng.between(minAge, 6.5)
    return { plan, ageDays, createdAt: now.getTime() - ageDays * DAY }
  })
  aged.sort((a, b) => a.createdAt - b.createdAt) // oldest first, so order numbers climb with time

  const citiesByRegion = Object.fromEntries(
    REGIONS.map((r) => [r, CITIES.filter((c) => regionForState(c.state) === r)]),
  ) as Record<Region, City[]>
  const pick = Object.fromEntries(
    REGIONS.map((r) => [r, weightedPicker(citiesByRegion[r], rng.next)]),
  ) as Record<Region, () => City>

  const orders: OrderRow[] = []
  const shipments: ShipmentRow[] = []
  const events: EventRow[] = []

  aged.forEach(({ plan, ageDays, createdAt }, i) => {
    const number = config.firstOrderNumber + i
    const city = pick[plan.region]()
    const orderId = `ord-${number}`
    const backorder = plan.stage === 'BACKORDER'
    orders.push({
      id: orderId,
      name: `#${number}`,
      createdAt: at(createdAt),
      destinationCity: city.city,
      destinationState: city.state,
      lat: city.lat,
      lng: city.lng,
      displayFulfillmentStatus: backorder ? 'ON_HOLD' : 'FULFILLED',
      holdReason: backorder ? 'INVENTORY_OUT_OF_STOCK' : null,
      assignedLocationId: warehouse.id,
    })
    if (backorder) return

    // A shipment, with events spread over the order's life so none is in the future.
    const when = (fraction: number) => at(createdAt + fraction * ageDays * DAY)
    const shipmentId = `shp-${number}`
    const inTransit = plan.stage === 'IN_TRANSIT'
    const purchased = rng.between(0.1, 0.3)
    const steps: [string, number][] = [['LABEL_PURCHASED', purchased]]
    if (inTransit || rng.next() < 0.5) steps.push(['LABEL_PRINTED', purchased + 0.02])
    if (inTransit) {
      steps.push(['CARRIER_PICKED_UP', rng.between(0.35, 0.55)])
      steps.push(['IN_TRANSIT', rng.between(0.55, 0.8)])
      if (rng.next() < 0.2) steps.push(['OUT_FOR_DELIVERY', rng.between(0.85, 0.95)])
    }
    steps.forEach(([status, fraction], n) =>
      events.push({ id: `evt-${number}-${n + 1}`, shipmentId, status, happenedAt: when(fraction) }),
    )

    // Carrier estimate: already past for late orders, still ahead for on-time ones.
    // Same side of "now" as the 7-day rule, so rule A and rule B agree on every shipped order.
    const estimate = plan.late ? createdAt + rng.between(5, 7) * DAY : now.getTime() + rng.between(0.5, 3) * DAY
    shipments.push({
      id: shipmentId,
      orderId,
      locationId: warehouse.id,
      createdAt: when(purchased),
      inTransitAt: inTransit ? events.find((e) => e.shipmentId === shipmentId && e.status === 'IN_TRANSIT')!.happenedAt : null,
      estimatedDeliveryAt: at(estimate),
      deliveredAt: null,
    })
  })

  return { locations: [warehouse], orders, shipments, events }
}
