'use client'

import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute } from 'three'
import type { Region } from '@/lib/regions'
import { useLanes } from '@/lib/hooks/useLanes'
import Instanced, { type Item } from './Instanced'
import { arrowGeometry, beadGeometry, destinationGeometry, lateBeadGeometry, warehouseGeometry } from './mapShapes'
import { laneLayout } from './laneLayout'
import { usMap } from './usMapGeometry'
import { dimColor, useRegionDims } from './useRegionDims'
import { useThemeColors } from './useThemeColors'

type P = [number, number]

// Line segments with one color per vertex, so a region's lanes can fade without another draw call.
function segments(lines: [P, P, Region][]): BufferGeometry {
  const positions: number[] = []
  const distances: number[] = []
  for (const [a, b] of lines) {
    positions.push(a[0], a[1], 0, b[0], b[1], 0)
    distances.push(0, Math.hypot(b[0] - a[0], b[1] - a[1])) // needed by the dashed material
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('lineDistance', new Float32BufferAttribute(distances, 1))
  g.setAttribute('color', new Float32BufferAttribute(new Array(positions.length).fill(1), 3))
  return g
}

// Writes each segment's color (faded by its region) into the geometry.
function paint(g: BufferGeometry, lines: [P, P, Region][], colorOf: (region: Region) => string) {
  const color = new Color()
  const attr = g.getAttribute('color') as BufferAttribute
  lines.forEach(([, , region], i) => {
    color.set(colorOf(region))
    attr.setXYZ(2 * i, color.r, color.g, color.b)
    attr.setXYZ(2 * i + 1, color.r, color.g, color.b)
  })
  attr.needsUpdate = true
}

// Lanes, order-day beads, destinations, warehouses. Where they go is laneLayout's job (D-009, D-010, D-011);
// this turns it into geometry and colors.
// Draw calls: 2 line sets + 2 bead sets + arrowheads + destinations + warehouses = 7.
export default function MapObjects() {
  const { data } = useLanes()
  const colors = useThemeColors()
  const dims = useRegionDims()
  const invalidate = useThree((st) => st.invalidate)

  // Callout 2: a region that is not selected fades.
  const tint = (color: string, region: Region) => dimColor(color, colors.bg, dims[region])

  // `dims` is a new object every render; this string says whether it changed.
  const dimKey = Object.values(dims).join(',')

  const layout = useMemo(() => (data ? laneLayout(data, usMap()) : null), [data])
  const lines = useMemo(() => layout && { solid: segments(layout.solid), dashed: segments(layout.dashed) }, [layout])

  useLayoutEffect(() => {
    if (!layout || !lines) return
    paint(lines.solid, layout.solid, (r) => tint(colors.ink, r))
    paint(lines.dashed, layout.dashed, (r) => tint(colors.late, r))
    invalidate()
  })

  const built = useMemo(() => {
    if (!layout) return null
    const ink = (late: boolean, region: Region) => tint(late ? colors.late : colors.ink, region)
    const beads = layout.beads.map((b) => ({ x: b.x, y: b.y, sx: b.r, sy: b.r, color: ink(b.late, b.region) }))
    return {
      beads: beads.filter((_, i) => !layout.beads[i].late),
      lateBeads: beads.filter((_, i) => layout.beads[i].late),
      arrows: layout.lanes.filter((l) => !l.spoke).map((l): Item => ({ x: l.from[0], y: l.from[1], color: ink(l.late > 0, l.region) })),
      destinations: layout.lanes.map((l): Item => ({ x: l.to[0], y: l.to[1], color: ink(l.late > l.onTime, l.region) })),
      warehouses: layout.warehouses.map(({ p: [x, y], region }): Item => ({ x, y, color: ink(false, region) })),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, colors, dimKey])

  if (!built || !lines) return null
  return (
    <>
      <lineSegments geometry={lines.solid} position-z={0.3}>
        <lineBasicMaterial vertexColors transparent opacity={0.6} depthWrite={false} />
      </lineSegments>
      {/* Late lanes are dashed as well as colored (rule 8). */}
      <lineSegments geometry={lines.dashed} position-z={0.3}>
        <lineDashedMaterial vertexColors dashSize={6} gapSize={4} transparent opacity={0.9} depthWrite={false} />
      </lineSegments>
      <Instanced items={built.arrows} geometry={arrowGeometry} z={0.35} />
      <Instanced items={built.beads} geometry={beadGeometry} z={0.4} />
      <Instanced items={built.lateBeads} geometry={lateBeadGeometry} z={0.4} />
      <Instanced items={built.destinations} geometry={destinationGeometry} z={0.5} />
      <Instanced items={built.warehouses} geometry={warehouseGeometry} z={0.6} />
    </>
  )
}
