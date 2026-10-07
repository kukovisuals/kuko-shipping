'use client'

import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useLanes } from '@/lib/hooks/useLanes'
import { project } from '@/lib/project'
import Instanced, { type Item } from './Instanced'
import { arrowGeometry, destinationGeometry, dotGeometry, warehouseGeometry } from './mapShapes'
import { REGIONS, type Region } from '@/lib/regions'
import { spread } from './spread'
import { regionOffset, usMap } from './usMapGeometry'
import { useThemeColors } from './useThemeColors'

type P = [number, number]

// Horizontal lanes end this far past their region's east edge.
const END_MARGIN = 24
// Gap between dots on a lane. A busy lane squeezes closer so every shipment still gets its dot.
const DOT_SPACING = 17
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

// A city's shipments on one lane: how many are on time and how many are late.
type Stop = { warehouseId: string; region: Region; lat: number; lng: number; onTime: number; late: number }

// Lanes, order dots, destinations, warehouses (D-009, D-010):
//  - one lane per city. Its on-time shipments ride the solid part, its late ones the dashed accent part;
//  - in the warehouse's own region it is a spoke, warehouse -> city;
//  - everywhere else it is a horizontal line from the region's east side flowing west to the city,
//    and lanes in a region are spread apart so none overlap.
// Draw calls: 2 line sets + dots + arrowheads + destinations + warehouses = 6.
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
      const stop = stops.get(key) ?? { warehouseId: lane.warehouseId, region: lane.region, lat: dest.lat, lng: dest.lng, onTime: 0, late: 0 }
      stop[lane.timing === 'LATE' ? 'late' : 'onTime'] += lane.shipments
      stops.set(key, stop)
    }

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
    const dots: Item[] = []
    const arrows: Item[] = []
    const destinations: Item[] = []

    for (const { stop, warehouse, to } of placed) {
      const total = stop.onTime + stop.late
      // Shipments are laid out from the city outward: on-time ones first (solid line, dark dots),
      // then late ones (dashed accent line, accent dots).
      let from: P // the far end of the lane: the warehouse, or the east side of the region
      let dotAt: (i: number) => P
      let split: P // where the solid part ends and the dashed part begins
      if (stop.region === warehouse.region) {
        from = warehouse.p
        const along = (u: number): P => [to[0] + (from[0] - to[0]) * u, to[1] + (from[1] - to[1]) * u]
        dotAt = (i) => along((i + 0.5) / total)
        split = along(stop.onTime / total)
      } else {
        from = [eastEdge[stop.region] + END_MARGIN, to[1]] // horizontal, flowing west
        const spacing = Math.min(DOT_SPACING, Math.abs(from[0] - to[0]) / (total + 1))
        dotAt = (i) => [to[0] + (i + 1) * spacing, to[1]]
        split = [to[0] + (stop.onTime + 0.5) * spacing, to[1]]
        arrows.push({ x: from[0], y: from[1], color: stop.late > 0 ? colors.late : colors.ink })
      }

      if (stop.late === 0) solid.push([to, from])
      else if (stop.onTime === 0) dashed.push([to, from])
      else {
        solid.push([to, split])
        dashed.push([split, from])
      }
      // One dot per shipment (OPEN-06).
      for (let i = 0; i < total; i++) {
        const [x, y] = dotAt(i)
        dots.push({ x, y, color: i < stop.onTime ? colors.ink : colors.late })
      }
      destinations.push({ x: to[0], y: to[1], color: stop.late > stop.onTime ? colors.late : colors.ink })
    }

    return {
      solid: segments(solid),
      dashed: segments(dashed),
      dots,
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
      <Instanced items={built.dots} geometry={dotGeometry} z={0.4} />
      <Instanced items={built.destinations} geometry={destinationGeometry} z={0.5} />
      <Instanced items={built.warehouses} geometry={warehouseGeometry} z={0.6} />
    </>
  )
}
