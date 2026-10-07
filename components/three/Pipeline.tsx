'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three'
import { CircleLabel, FlowNote, RegionName, StackCount, StageTitle } from '@/components/dom/PipelineLabels'
import { usePipeline } from '@/lib/hooks/usePipeline'
import { REGIONS } from '@/lib/regions'
import Instanced, { type Item } from './Instanced'
import {
  FLOWS,
  FLOW_NOTES,
  PIPELINE_H,
  PIPELINE_W,
  STAGE_TITLES,
  STORE,
  TRANSIT,
  countAt,
  nameAt,
  pipelineLayout,
  type Circle,
  type Pt,
} from './pipelineLayout'
import { fmt } from '@/components/dom/format'
import { useThemeColors } from './useThemeColors'
import { useZoneFit } from './useZone'

// Layout units (y down) to scene units (centered, y up).
const lay = (x: number, y: number): Pt => [x - PIPELINE_W / 2, PIPELINE_H / 2 - y]

const slab = new PlaneGeometry(1, 1)

// A DOM label pinned to a scene point. Centered on the point, or starting at it when `left`.
function Label({ at, left, children }: { at: [number, number, number]; left?: boolean; children: ReactNode }) {
  return (
    <Html position={at} center={!left} zIndexRange={[0, 0]} style={{ pointerEvents: 'none', ...(left && { marginTop: '-0.5em' }) }}>
      {children}
    </Html>
  )
}

function ring({ cx, cy, r }: Circle, steps = 48): [Pt, Pt][] {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    const b = ((i + 1) / steps) * Math.PI * 2
    return [[cx + r * Math.cos(a), cy + r * Math.sin(a)], [cx + r * Math.cos(b), cy + r * Math.sin(b)]] as [Pt, Pt]
  })
}

// A polyline as segments, with a small arrowhead at its last point when asked.
function flowLines(path: Pt[], arrow?: 'down' | 'left'): [Pt, Pt][] {
  const lines = path.slice(1).map((p, i) => [path[i], p] as [Pt, Pt])
  const [x, y] = path[path.length - 1]
  if (arrow === 'down') lines.push([[x - 4, y - 6], [x, y]], [[x + 4, y - 6], [x, y]])
  if (arrow === 'left') lines.push([[x + 6, y - 4], [x, y]], [[x + 6, y + 4], [x, y]])
  return lines
}

// Store and In transit circles plus every flow line.
function lineGeometry(): BufferGeometry {
  const lines: [Pt, Pt][] = [...ring(STORE), ...ring(TRANSIT), ...FLOWS.flatMap(({ path, arrow }) => flowLines(path, arrow))]
  const positions = lines.flatMap(([a, b]) => [...lay(...a), 0, ...lay(...b), 0])
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

// The dotted fill of the In transit circle (left clear in the middle, where the count sits).
function transitDots(): BufferGeometry {
  const positions: number[] = []
  const gap = 5
  for (let x = -TRANSIT.r; x <= TRANSIT.r; x += gap)
    for (let y = -TRANSIT.r; y <= TRANSIT.r; y += gap)
      if (Math.hypot(x, y) < TRANSIT.r - 3 && Math.hypot(x, y) > 13) positions.push(...lay(TRANSIT.cx + x, TRANSIT.cy + y), 0)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

// Stacks of thin slabs, one stack per region per stage, from /api/pipeline.
// Draw calls: slabs + circles/arrows + dotted circle = 3 (the labels are DOM).
export default function Pipeline() {
  const { data } = usePipeline()
  const colors = useThemeColors()
  const fit = useZoneFit('.pipeline', PIPELINE_W, PIPELINE_H)

  const lines = useMemo(() => lineGeometry(), [])
  const dots = useMemo(() => transitDots(), [])
  const layout = useMemo(() => (data ? pipelineLayout(data) : null), [data])
  const slabs = useMemo<Item[]>(() => {
    if (!layout) return []
    const { stacks, pitch } = layout
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
  }, [layout, colors])

  if (!fit || !data || !layout) return null
  const at = ([x, y]: Pt) => [...lay(x, y), 0] as [number, number, number]
  const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? id
  return (
    <group position={fit.position} scale={fit.scale}>
      <Instanced items={slabs} geometry={slab} z={0.1} />
      <lineSegments geometry={lines} position-z={0.2}>
        <lineBasicMaterial color={colors.ink} />
      </lineSegments>
      <points geometry={dots} position-z={0.2}>
        <pointsMaterial color={colors.ink} size={1.6} sizeAttenuation={false} />
      </points>
      {/* Text is DOM (rule 5): each label is a small DOM piece pinned to a point in the scene. */}
      {layout.stacks.map((st) => (
        <Fragment key={`${st.stage}-${st.region}`}>
          <Label at={at(countAt(st))}>
            <StackCount value={st.count} />
          </Label>
          <Label at={at(nameAt(st))}>
            <RegionName name={regionName(st.region)} />
          </Label>
        </Fragment>
      ))}
      {STAGE_TITLES.map(({ text, at: p }) => (
        <Label key={text} at={at(p)} left>
          <StageTitle text={text} />
        </Label>
      ))}
      {FLOW_NOTES.map(({ text, at: p }) => (
        <Label key={text} at={at(p)} left>
          <FlowNote text={text} />
        </Label>
      ))}
      <Label at={at([STORE.cx, STORE.cy])}>
        <CircleLabel text="Store" />
      </Label>
      <Label at={at([TRANSIT.cx, TRANSIT.cy])}>
        <CircleLabel text={fmt(data.inTransit)} />
      </Label>
    </group>
  )
}
