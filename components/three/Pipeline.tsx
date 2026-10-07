'use client'

import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three'
import { usePipeline } from '@/lib/hooks/usePipeline'
import Instanced, { type Item } from './Instanced'
import {
  PIPELINE_H,
  PIPELINE_W,
  STORE,
  TRANSIT,
  pipelineLayout,
  type Circle,
} from './pipelineLayout'
import { useThemeColors } from './useThemeColors'
import { useZoneFit } from './useZone'

type P = [number, number]

// Layout units (y down) to scene units (centered, y up).
const lay = (x: number, y: number): P => [x - PIPELINE_W / 2, PIPELINE_H / 2 - y]

const slab = new PlaneGeometry(1, 1)

function ring({ cx, cy, r }: Circle, steps = 48): [P, P][] {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    const b = ((i + 1) / steps) * Math.PI * 2
    return [[cx + r * Math.cos(a), cy + r * Math.sin(a)], [cx + r * Math.cos(b), cy + r * Math.sin(b)]] as [P, P]
  })
}

// Elbow with a small arrowhead at the end. `path` is the corner points, last one is the tip.
function arrow(path: P[], head: 'down'): [P, P][] {
  const lines = path.slice(1).map((p, i) => [path[i], p] as [P, P])
  const [x, y] = path[path.length - 1]
  if (head === 'down') lines.push([[x - 4, y - 6], [x, y]], [[x + 4, y - 6], [x, y]])
  return lines
}

// Store and In transit circles, the connectors, and the "no stock" / "restocked" arrows.
function lineGeometry(): BufferGeometry {
  const lines: [P, P][] = [
    ...ring(STORE),
    ...ring(TRANSIT),
    [[STORE.cx, STORE.cy + STORE.r], [STORE.cx, 120]], // store -> ordered
    [[TRANSIT.cx, 556], [TRANSIT.cx, TRANSIT.cy - TRANSIT.r]], // packed -> in transit
    ...arrow([[204, 215], [254, 215], [254, 318]], 'down'), // no stock
    ...arrow([[142, 345], [100, 345], [100, 382]], 'down'), // restocked
  ]
  const positions = lines.flatMap(([a, b]) => [...lay(...a), 0, ...lay(...b), 0])
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

// The dotted fill of the In transit circle.
function transitDots(): BufferGeometry {
  const positions: number[] = []
  const gap = 5
  for (let x = -TRANSIT.r; x <= TRANSIT.r; x += gap)
    for (let y = -TRANSIT.r; y <= TRANSIT.r; y += gap)
      if (Math.hypot(x, y) < TRANSIT.r - 3) positions.push(...lay(TRANSIT.cx + x, TRANSIT.cy + y), 0)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

// Stacks of thin slabs, one stack per region per stage, from /api/pipeline.
// Draw calls: slabs + circles/arrows + dotted circle = 3.
export default function Pipeline() {
  const { data } = usePipeline()
  const colors = useThemeColors()
  const fit = useZoneFit('.pipeline', PIPELINE_W, PIPELINE_H)

  const lines = useMemo(() => lineGeometry(), [])
  const dots = useMemo(() => transitDots(), [])
  const slabs = useMemo<Item[]>(() => {
    if (!data) return []
    const { stacks, pitch } = pipelineLayout(data)
    return stacks.flatMap(({ stage, x, base, w, h, count }) => {
      const n = count > 0 ? Math.max(1, Math.round(h / pitch)) : 0
      const [px] = lay(x + w / 2, 0)
      return Array.from({ length: n }, (_, i) => ({
        x: px,
        y: lay(0, base - pitch * (i + 0.5))[1],
        sx: w,
        sy: pitch * 0.55,
        color: stage === 'backorder' ? colors.muted : colors.ink,
      }))
    })
  }, [data, colors])

  if (!fit || !data) return null
  return (
    <group position={fit.position} scale={fit.scale}>
      <Instanced items={slabs} geometry={slab} z={0.1} />
      <lineSegments geometry={lines} position-z={0.2}>
        <lineBasicMaterial color={colors.ink} />
      </lineSegments>
      <points geometry={dots} position-z={0.2}>
        <pointsMaterial color={colors.ink} size={1.6} sizeAttenuation={false} />
      </points>
    </group>
  )
}
