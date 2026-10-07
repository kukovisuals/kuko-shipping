// Where every lane, bead, arrowhead, destination and warehouse goes on the map (D-009, D-010, D-011).
// Pure: lanes data + map outlines in, positions out. MapObjects turns them into geometry and colors.
import type { Lanes } from '../../lib/hooks/types'
import { project } from '../../lib/project'
import { REGIONS, type Region } from '../../lib/regions'
import { spread } from './spread'
import { regionOffset, type Pt, type UsMap } from './usMapGeometry'

// Horizontal lanes end this far past their region's east edge, unless another region is in the way.
export const END_MARGIN = 24
// Smallest distance between two horizontal lanes in a region.
export const LANE_GAP = 13
// Smallest angle between two spokes from one warehouse, in radians (about 9°).
export const SPOKE_ANGLE = 0.16
// Shortest spoke, so a city right next to the warehouse doesn't hide under its rings.
export const MIN_SPOKE = 24
// Bead radius: a busy day (the BUSY_DAY share of days are this size or smaller) and anything
// above it get BEAD_MAX, so one very big day never turns into a blob. No bead is smaller than BEAD_MIN.
export const BEAD_MAX = 6
const BEAD_MIN = 2
const BUSY_DAY = 0.9
// How close a lane, beads included, may come to another region's outline.
export const CLEARANCE = BEAD_MAX + 4

type Day = { ageDays: number; shipments: number; late: boolean }

export type PlacedLane = {
  city: string
  region: Region
  spoke: boolean // true in the warehouse's own region: a straight line warehouse -> city
  from: Pt // the lane's start: the warehouse, or the east end where the arrowhead sits
  to: Pt // the city
  onTime: number
  late: number
}

export type LaneLayout = {
  lanes: PlacedLane[]
  solid: [Pt, Pt][]
  dashed: [Pt, Pt][]
  beads: { x: number; y: number; r: number; late: boolean }[]
  warehouses: Pt[]
}

// Where a point sits once its region is drawn apart from the others.
function place(lat: number, lng: number, region: Region): Pt | null {
  const p = project(lat, lng)
  const [dx, dy] = regionOffset(region)
  return p && [p[0] + dx, p[1] + dy]
}

// The westmost x, east of `fromX`, where any region other than `region` comes within `band` of height y.
function blockedAt(y: number, fromX: number, region: Region, rings: UsMap['rings'], band: number): number {
  let x = Infinity
  for (const { id } of REGIONS) {
    if (id === region) continue
    for (const ring of rings[id]) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % ring.length]
        if (Math.max(a[1], b[1]) < y - band || Math.min(a[1], b[1]) > y + band) continue
        const west = Math.min(a[0], b[0])
        if (Math.max(a[0], b[0]) > fromX) x = Math.min(x, Math.max(west, fromX))
      }
    }
  }
  return x
}

export function laneLayout(data: Lanes, map: Pick<UsMap, 'eastEdge' | 'rings'>): LaneLayout {
  const warehouses = new Map(data.warehouses.map((w) => [w.id, { region: w.region, p: place(w.lat, w.lng, w.region) }]))

  // One stop per city: its on-time and late shipments and its order days.
  type Stop = { city: string; warehouseId: string; region: Region; lat: number; lng: number; onTime: number; late: number; days: Day[] }
  const stops = new Map<string, Stop>()
  for (const lane of data.lanes) {
    const dest = lane.destinations[0]
    const key = `${lane.warehouseId}|${dest.lat},${dest.lng}`
    const stop = stops.get(key) ?? { city: dest.city, warehouseId: lane.warehouseId, region: lane.region, lat: dest.lat, lng: dest.lng, onTime: 0, late: 0, days: [] }
    stop[lane.timing === 'LATE' ? 'late' : 'onTime'] += lane.shipments
    for (const d of lane.days) stop.days.push({ ageDays: d.ageDays, shipments: d.shipments, late: lane.timing === 'LATE' })
    stops.set(key, stop)
  }

  const placed = [...stops.values()].flatMap((stop) => {
    const warehouse = warehouses.get(stop.warehouseId)
    const to = place(stop.lat, stop.lng, stop.region)
    return warehouse?.p && to ? [{ stop, warehouse: { region: warehouse.region, p: warehouse.p }, to }] : []
  })

  // Horizontal lanes: heights spread apart, region by region, so none overlap.
  const horizontal = placed.filter((m) => m.stop.region !== m.warehouse.region)
  for (const { id } of REGIONS) {
    const inRegion = horizontal.filter((m) => m.stop.region === id)
    const ys = spread(inRegion.map((m) => m.to[1]), LANE_GAP)
    inRegion.forEach((m, i) => (m.to = [m.to[0], ys[i]]))
  }
  // Spokes: fanned apart around their warehouse so no two lie on top of each other, and never shorter than MIN_SPOKE.
  for (const [id, w] of warehouses) {
    if (!w.p) continue
    const [wx, wy] = w.p
    const spokes = placed.filter((m) => m.stop.warehouseId === id && m.stop.region === m.warehouse.region)
    const angles = spread(spokes.map((m) => Math.atan2(m.to[1] - wy, m.to[0] - wx)), SPOKE_ANGLE)
    spokes.forEach((m, i) => {
      const len = Math.max(MIN_SPOKE, Math.hypot(m.to[0] - wx, m.to[1] - wy))
      m.to = [wx + len * Math.cos(angles[i]), wy + len * Math.sin(angles[i])]
    })
  }

  const days = [...stops.values()].flatMap((s) => s.days)
  const slots = Math.max(0, ...days.map((d) => d.ageDays)) + 1 // today .. oldest day
  const sizes = days.map((d) => d.shipments).sort((a, b) => a - b)
  const busy = Math.max(1, sizes[Math.floor(BUSY_DAY * (sizes.length - 1))] ?? 1)
  const radius = (n: number) => Math.max(BEAD_MIN, BEAD_MAX * Math.sqrt(Math.min(n, busy) / busy))

  const out: LaneLayout = { lanes: [], solid: [], dashed: [], beads: [], warehouses: [] }
  for (const [, w] of warehouses) if (w.p) out.warehouses.push(w.p)

  for (const { stop, warehouse, to } of placed) {
    const spoke = stop.region === warehouse.region
    // A horizontal lane flows west from just past its region's east side, stopping short of any other region.
    const from: Pt = spoke
      ? warehouse.p
      : [Math.min(map.eastEdge[stop.region] + END_MARGIN, blockedAt(to[1], to[0], stop.region, map.rings, CLEARANCE) - CLEARANCE), to[1]]
    out.lanes.push({ city: stop.city, region: stop.region, spoke, from, to, onTime: stop.onTime, late: stop.late })

    // Day slot -> point on the lane: today next to the start, the oldest day next to the city.
    const at = (age: number): Pt => {
      const t = (age + 1) / (slots + 1)
      return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
    }
    // A short lane has tight slots; beads shrink there so neighbours never overlap.
    const room = (0.48 * Math.hypot(to[0] - from[0], to[1] - from[1])) / (slots + 1)

    // Solid from the start through the on-time days, dashed accent from there through the late days.
    const late = stop.days.filter((d) => d.late)
    if (late.length === 0) out.solid.push([from, to])
    else if (stop.onTime === 0) out.dashed.push([from, to])
    else {
      const split = at(Math.min(...late.map((d) => d.ageDays)) - 0.5)
      out.solid.push([from, split])
      out.dashed.push([split, to])
    }

    for (const d of stop.days) {
      const [x, y] = at(d.ageDays)
      out.beads.push({ x, y, r: Math.min(radius(d.shipments), Math.max(room, BEAD_MIN)), late: d.late })
    }
  }
  return out
}
