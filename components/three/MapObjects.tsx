'use client'

import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useLanes } from '@/lib/hooks/useLanes'
import { project } from '@/lib/project'
import Instanced, { type Item } from './Instanced'
import { destinationGeometry, dotGeometry, warehouseGeometry } from './mapShapes'
import { useThemeColors } from './useThemeColors'

type P = [number, number]

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

// Lanes, order dots, destinations, warehouses: all from /api/lanes, all through project().
// Draw calls: 2 line sets + dots + destinations + warehouses = 5.
export default function MapObjects() {
  const { data } = useLanes()
  const colors = useThemeColors()

  const built = useMemo(() => {
    if (!data) return null
    const warehouses = new Map(data.warehouses.map((w) => [w.id, project(w.lat, w.lng)]))
    const onTime: [P, P][] = []
    const late: [P, P][] = []
    const dots: Item[] = []
    const destinations = new Map<string, { p: P; late: boolean }>()
    const colorFor = (isLate: boolean) => (isLate ? colors.late : colors.ink)

    for (const lane of data.lanes) {
      const from = warehouses.get(lane.warehouseId)
      const dest = lane.destinations[0]
      const to = project(dest.lat, dest.lng)
      if (!from || !to) continue
      const isLate = lane.timing === 'LATE'
      ;(isLate ? late : onTime).push([from, to])
      // One dot per shipment (OPEN-06), spread evenly along the lane.
      for (let i = 0; i < lane.shipments; i++) {
        const t = (i + 0.5) / lane.shipments
        dots.push({ x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t, color: colorFor(isLate) })
      }
      const key = `${dest.lat},${dest.lng}`
      const seen = destinations.get(key)
      destinations.set(key, { p: to, late: isLate || !!seen?.late })
    }

    return {
      onTime: segments(onTime),
      late: segments(late),
      dots,
      destinations: [...destinations.values()].map(({ p, late }) => ({ x: p[0], y: p[1], color: colorFor(late) })),
      warehouses: [...warehouses.values()].flatMap((p) => (p ? [{ x: p[0], y: p[1], color: colors.ink }] : [])),
    }
  }, [data, colors])

  if (!built) return null
  return (
    <>
      <lineSegments geometry={built.onTime} position-z={0.3}>
        <lineBasicMaterial color={colors.ink} transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
      {/* Late lanes are dashed as well as colored (rule 8). */}
      <lineSegments geometry={built.late} position-z={0.3}>
        <lineDashedMaterial color={colors.late} dashSize={6} gapSize={4} transparent opacity={0.9} depthWrite={false} />
      </lineSegments>
      <Instanced items={built.dots} geometry={dotGeometry} z={0.4} />
      <Instanced items={built.destinations} geometry={destinationGeometry} z={0.5} />
      <Instanced items={built.warehouses} geometry={warehouseGeometry} z={0.6} />
    </>
  )
}
