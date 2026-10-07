'use client'

import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useLanes } from '@/lib/hooks/useLanes'
import { project } from '@/lib/project'
import Instanced, { type Item } from './Instanced'
import { arrowGeometry, destinationGeometry, dotGeometry, warehouseGeometry } from './mapShapes'
import { regionOffset, usMap } from './usMapGeometry'
import { useThemeColors } from './useThemeColors'

type P = [number, number]

// Horizontal lanes end this far past their region's east edge.
const END_MARGIN = 24
// Gap between dots on a lane. A busy lane squeezes closer so every shipment still gets its dot.
const DOT_SPACING = 17

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

// Lanes, order dots, destinations, warehouses (D-009):
//  - in the warehouse's own region a lane is a spoke, warehouse -> city;
//  - everywhere else it is a horizontal line from the region's east side flowing west to the city.
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
    const onTime: [P, P][] = []
    const late: [P, P][] = []
    const dots: Item[] = []
    const arrows: Item[] = []
    const destinations = new Map<string, { p: P; late: boolean }>()
    const colorFor = (isLate: boolean) => (isLate ? colors.late : colors.ink)

    for (const lane of data.lanes) {
      const warehouse = warehouses.get(lane.warehouseId)
      const dest = lane.destinations[0]
      const to = place(dest.lat, dest.lng, regionOffset(lane.region))
      if (!warehouse?.p || !to) continue
      const isLate = lane.timing === 'LATE'
      const color = colorFor(isLate)

      let from: P
      let dotAt: (i: number) => P
      if (lane.region === warehouse.region) {
        from = warehouse.p // spoke; shipments spread evenly along it
        dotAt = (i) => {
          const t = (i + 0.5) / lane.shipments
          return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
        }
      } else {
        from = [eastEdge[lane.region] + END_MARGIN, to[1]] // horizontal, flowing west
        arrows.push({ x: from[0], y: from[1], color })
        const spacing = Math.min(DOT_SPACING, Math.abs(from[0] - to[0]) / (lane.shipments + 1))
        dotAt = (i) => [to[0] + (i + 1) * spacing, to[1]]
      }

      ;(isLate ? late : onTime).push([from, to])
      // One dot per shipment (OPEN-06).
      for (let i = 0; i < lane.shipments; i++) {
        const [x, y] = dotAt(i)
        dots.push({ x, y, color })
      }
      const key = `${dest.lat},${dest.lng}`
      destinations.set(key, { p: to, late: isLate || !!destinations.get(key)?.late })
    }

    return {
      onTime: segments(onTime),
      late: segments(late),
      dots,
      arrows,
      destinations: [...destinations.values()].map(({ p, late }) => ({ x: p[0], y: p[1], color: colorFor(late) })),
      warehouses: [...warehouses.values()].flatMap(({ p }) => (p ? [{ x: p[0], y: p[1], color: colors.ink }] : [])),
    }
  }, [data, colors])

  if (!built) return null
  return (
    <>
      <lineSegments geometry={built.onTime} position-z={0.3}>
        <lineBasicMaterial color={colors.ink} transparent opacity={0.6} depthWrite={false} />
      </lineSegments>
      {/* Late lanes are dashed as well as colored (rule 8). */}
      <lineSegments geometry={built.late} position-z={0.3}>
        <lineDashedMaterial color={colors.late} dashSize={6} gapSize={4} transparent opacity={0.9} depthWrite={false} />
      </lineSegments>
      <Instanced items={built.arrows} geometry={arrowGeometry} z={0.35} />
      <Instanced items={built.dots} geometry={dotGeometry} z={0.4} />
      <Instanced items={built.destinations} geometry={destinationGeometry} z={0.5} />
      <Instanced items={built.warehouses} geometry={warehouseGeometry} z={0.6} />
    </>
  )
}
