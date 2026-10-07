'use client'

import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useLanes } from '@/lib/hooks/useLanes'
import { project } from '@/lib/project'
import Instanced, { type Item } from './Instanced'
import { arrowGeometry, beadGeometry, destinationGeometry, lateBeadGeometry, warehouseGeometry } from './mapShapes'
import { REGIONS, type Region } from '@/lib/regions'
import { spread } from './spread'
import { regionOffset, usMap } from './usMapGeometry'
import { useThemeColors } from './useThemeColors'

type P = [number, number]

// Horizontal lanes end this far past their region's east edge.
const END_MARGIN = 24
// Bead radius: a busy day (the BUSY_DAY share of days are this size or smaller) and anything
// above it get BEAD_MAX, so one very big day never turns into a blob. No bead is smaller than BEAD_MIN.
const BEAD_MAX = 6
const BEAD_MIN = 2
const BUSY_DAY = 0.9
// Smallest distance between two horizontal lanes in a region.
const LANE_GAP = 13

function segments(lines: [P, P][]): BufferGeometry {
  const positions: number[] = []
  const distances: number[] = []
  for (const [a, b] of lines) {
    positions.push(a[0], a[1], 0, b[0], b[1], 0)
    distances.push(0, Math.hypot(b[0] - a[0], b[1] - a[1])) // needed by the dashed material
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('lineDistance', new Float32BufferAttribute(distances, 1))
  return g
}

// Where a point sits once its region is drawn apart from the others.
function place(lat: number, lng: number, offset: P): P | null {
  const p = project(lat, lng)
  return p && [p[0] + offset[0], p[1] + offset[1]]
}

// A city's shipments on one lane: how many are on time and how many are late, and its order days.
type Day = { ageDays: number; shipments: number; late: boolean }
type Stop = { warehouseId: string; region: Region; lat: number; lng: number; onTime: number; late: number; days: Day[] }

// Lanes, order-day beads, destinations, warehouses (D-009, D-010, D-011):
//  - one lane per city, with one bead per order day. Day slots run from today at the lane's start
//    (arrowhead or warehouse) to the oldest day at the city, so late beads gather at the city end
//    on the dashed accent part, and on-time beads sit on the solid part;
//  - a bead's area grows with that day's shipments, on one scale for the whole map;
//  - in the warehouse's own region it is a spoke, warehouse -> city;
//  - everywhere else it is a horizontal line from the region's east side flowing west to the city,
//    and lanes in a region are spread apart so none overlap.
// Draw calls: 2 line sets + 2 bead sets + arrowheads + destinations + warehouses = 7.
export default function MapObjects() {
  const { data } = useLanes()
  const colors = useThemeColors()

  const built = useMemo(() => {
    if (!data) return null
    const { eastEdge } = usMap()
    const warehouses = new Map(
      data.warehouses.map((w) => [w.id, { region: w.region, p: place(w.lat, w.lng, regionOffset(w.region)) }]),
    )

    const stops = new Map<string, Stop>()
    for (const lane of data.lanes) {
      const dest = lane.destinations[0]
      const key = `${lane.warehouseId}|${dest.lat},${dest.lng}`
      const stop = stops.get(key) ?? { warehouseId: lane.warehouseId, region: lane.region, lat: dest.lat, lng: dest.lng, onTime: 0, late: 0, days: [] }
      stop[lane.timing === 'LATE' ? 'late' : 'onTime'] += lane.shipments
      for (const d of lane.days) stop.days.push({ ageDays: d.ageDays, shipments: d.shipments, late: lane.timing === 'LATE' })
      stops.set(key, stop)
    }
    const days = [...stops.values()].flatMap((s) => s.days)
    const slots = Math.max(0, ...days.map((d) => d.ageDays)) + 1 // today .. oldest day
    const sizes = days.map((d) => d.shipments).sort((a, b) => a - b)
    const busy = Math.max(1, sizes[Math.floor(BUSY_DAY * (sizes.length - 1))] ?? 1)
    const radius = (n: number) => Math.max(BEAD_MIN, BEAD_MAX * Math.sqrt(Math.min(n, busy) / busy))

    // Where each destination sits. Horizontal lanes get their heights spread apart, region by region.
    const placed = [...stops.values()].flatMap((stop) => {
      const warehouse = warehouses.get(stop.warehouseId)
      const to = place(stop.lat, stop.lng, regionOffset(stop.region))
      return warehouse?.p && to ? [{ stop, warehouse: { ...warehouse, p: warehouse.p }, to }] : []
    })
    const horizontal = placed.filter((m) => m.stop.region !== m.warehouse.region)
    for (const { id } of REGIONS) {
      const inRegion = horizontal.filter((m) => m.stop.region === id)
      const ys = spread(inRegion.map((m) => m.to[1]), LANE_GAP)
      inRegion.forEach((m, i) => (m.to = [m.to[0], ys[i]]))
    }

    const solid: [P, P][] = []
    const dashed: [P, P][] = []
    const beads: Item[] = []
    const lateBeads: Item[] = []
    const arrows: Item[] = []
    const destinations: Item[] = []

    for (const { stop, warehouse, to } of placed) {
      // The lane's start: the warehouse, or just past the east side of the region (flowing west).
      const from: P = stop.region === warehouse.region ? warehouse.p : [eastEdge[stop.region] + END_MARGIN, to[1]]
      if (stop.region !== warehouse.region) arrows.push({ x: from[0], y: from[1], color: stop.late > 0 ? colors.late : colors.ink })

      // Day slot -> point on the lane: today next to the start, the oldest day next to the city.
      const at = (age: number): P => {
        const t = (age + 1) / (slots + 1)
        return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
      }
      // A short lane has tight slots; beads shrink there so neighbours never overlap.
      const room = (0.48 * Math.hypot(to[0] - from[0], to[1] - from[1])) / (slots + 1)

      // Solid from the start through the on-time days, dashed accent from there through the late days.
      const late = stop.days.filter((d) => d.late)
      if (late.length === 0) solid.push([from, to])
      else if (stop.onTime === 0) dashed.push([from, to])
      else {
        const split = at(Math.min(...late.map((d) => d.ageDays)) - 0.5)
        solid.push([from, split])
        dashed.push([split, to])
      }

      for (const d of stop.days) {
        const [x, y] = at(d.ageDays)
        const r = Math.min(radius(d.shipments), Math.max(room, BEAD_MIN))
        ;(d.late ? lateBeads : beads).push({ x, y, sx: r, sy: r, color: d.late ? colors.late : colors.ink })
      }
      destinations.push({ x: to[0], y: to[1], color: stop.late > stop.onTime ? colors.late : colors.ink })
    }

    return {
      solid: segments(solid),
      dashed: segments(dashed),
      beads,
      lateBeads,
      arrows,
      destinations,
      warehouses: [...warehouses.values()].flatMap(({ p }) => (p ? [{ x: p[0], y: p[1], color: colors.ink }] : [])),
    }
  }, [data, colors])

  if (!built) return null
  return (
    <>
      <lineSegments geometry={built.solid} position-z={0.3}>
        <lineBasicMaterial color={colors.ink} transparent opacity={0.6} depthWrite={false} />
      </lineSegments>
      {/* Late lanes are dashed as well as colored (rule 8). */}
      <lineSegments geometry={built.dashed} position-z={0.3}>
        <lineDashedMaterial color={colors.late} dashSize={6} gapSize={4} transparent opacity={0.9} depthWrite={false} />
      </lineSegments>
      <Instanced items={built.arrows} geometry={arrowGeometry} z={0.35} />
      <Instanced items={built.beads} geometry={beadGeometry} z={0.4} />
      <Instanced items={built.lateBeads} geometry={lateBeadGeometry} z={0.4} />
      <Instanced items={built.destinations} geometry={destinationGeometry} z={0.5} />
      <Instanced items={built.warehouses} geometry={warehouseGeometry} z={0.6} />
    </>
  )
}
