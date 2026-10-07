'use client'

import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useLanes } from '@/lib/hooks/useLanes'
import Instanced, { type Item } from './Instanced'
import { arrowGeometry, beadGeometry, destinationGeometry, lateBeadGeometry, warehouseGeometry } from './mapShapes'
import { laneLayout } from './laneLayout'
import { usMap } from './usMapGeometry'
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

// Lanes, order-day beads, destinations, warehouses. Where they go is laneLayout's job (D-009, D-010, D-011);
// this turns it into geometry and colors.
// Draw calls: 2 line sets + 2 bead sets + arrowheads + destinations + warehouses = 7.
export default function MapObjects() {
  const { data } = useLanes()
  const colors = useThemeColors()

  const built = useMemo(() => {
    if (!data) return null
    const layout = laneLayout(data, usMap())
    const ink = (late: boolean) => (late ? colors.late : colors.ink)
    const beads = layout.beads.map((b) => ({ x: b.x, y: b.y, sx: b.r, sy: b.r, color: ink(b.late) }))
    return {
      solid: segments(layout.solid),
      dashed: segments(layout.dashed),
      beads: beads.filter((_, i) => !layout.beads[i].late),
      lateBeads: beads.filter((_, i) => layout.beads[i].late),
      arrows: layout.lanes.filter((l) => !l.spoke).map((l): Item => ({ x: l.from[0], y: l.from[1], color: ink(l.late > 0) })),
      destinations: layout.lanes.map((l): Item => ({ x: l.to[0], y: l.to[1], color: ink(l.late > l.onTime) })),
      warehouses: layout.warehouses.map(([x, y]): Item => ({ x, y, color: colors.ink })),
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
