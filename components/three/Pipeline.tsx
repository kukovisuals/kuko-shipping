'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three'
import { CircleLabel, FlowNote, RegionName, StackCount, StageTitle, StageTotal, StoreButton } from '@/components/dom/PipelineLabels'
import { usePipeline } from '@/lib/hooks/usePipeline'
import { useStore } from '@/lib/store'
import { REGIONS } from '@/lib/regions'
import Instanced, { type Item } from './Instanced'
import {
  COLLAPSIBLE,
  FLOWS,
  FLOW_NOTES,
  PIPELINE_H,
  PIPELINE_W,
  STAGE_TITLES,
  STORE,
  TRANSIT,
  boxCenter,
  collapsedBox,
  countAt,
  nameAt,
  pipelineLayout,
  slabPose,
  type Circle,
  type Pt,
} from './pipelineLayout'
import { fmt } from '@/components/dom/format'
import { useThemeColors } from './useThemeColors'
import { smooth, useTween } from './useTween'
import { useZoneFit } from './useZone'

// Layout units (y down) to scene units (centered, y up).
const lay = (x: number, y: number): Pt => [x - PIPELINE_W / 2, PIPELINE_H / 2 - y]

const slab = new PlaneGeometry(1, 1)

// A DOM label pinned to a scene point. Centered on the point, or starting at it when `left`.
// `hidden` fades it out (CSS, so reduced motion drops the fade); `interactive` lets it take clicks.
function Label({
  at,
  left,
  hidden,
  interactive,
  children,
}: {
  at: [number, number, number]
  left?: boolean
  hidden?: boolean
  interactive?: boolean
  children: ReactNode
}) {
  return (
    <Html
      position={at}
      center={!left}
      zIndexRange={[0, 0]}
      style={{
        pointerEvents: interactive && !hidden ? 'auto' : 'none',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 300ms ease',
        ...(left && { marginTop: '-0.5em' }),
      }}
    >
      {/* aria-hidden goes here: Html hands unknown props to the three.js group, which rejects them. */}
      <div aria-hidden={hidden || undefined}>{children}</div>
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

// The box each collapsible stage turns into (callout 1): one rectangle per stage.
function boxGeometry(): BufferGeometry {
  const lines = COLLAPSIBLE.flatMap((stage) => {
    const { x, base, w, h } = collapsedBox(stage)
    const [a, b, c, d]: Pt[] = [[x, base - h], [x + w, base - h], [x + w, base], [x, base]]
    return [[a, b], [b, c], [c, d], [d, a]] as [Pt, Pt][]
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(lines.flatMap(([a, b]) => [...lay(...a), 0, ...lay(...b), 0]), 3))
  return g
}

// The slabs, and the box they close up into. Its own component, so only it re-renders during the ~300 ms tween.
// Slabs fade out and the box fades in over the second half, so nothing pops.
function Slabs({ layout, collapsed }: { layout: ReturnType<typeof pipelineLayout>; collapsed: boolean }) {
  const colors = useThemeColors()
  const [t] = useTween([collapsed ? 1 : 0])
  const box = useMemo(() => boxGeometry(), [])
  const move = smooth(t)
  const fade = smooth(Math.max(0, Math.min(1, (t - 0.5) / 0.5)))

  // Backorder never collapses, so it is its own set and does not fade.
  const [slabs, backorder] = useMemo(() => {
    const { stacks, pitch } = layout
    const moving: Item[] = []
    const still: Item[] = []
    for (const st of stacks) {
      const n = st.count > 0 ? Math.max(1, Math.round(st.h / pitch)) : 0
      for (let row = 0; row < n; row++) {
        const p = slabPose(st, row, n, move, pitch)
        const isBackorder = st.stage === 'backorder'
        ;(isBackorder ? still : moving).push({
          x: lay(p.cx, 0)[0],
          y: lay(0, p.y)[1],
          sx: p.w,
          sy: pitch * 0.55,
          color: isBackorder ? colors.muted : colors.ink,
        })
      }
    }
    return [moving, still]
  }, [layout, colors, move])

  return (
    <>
      <Instanced items={slabs} geometry={slab} z={0.1} opacity={1 - fade} />
      <Instanced items={backorder} geometry={slab} z={0.1} />
      <lineSegments geometry={box} position-z={0.2}>
        <lineBasicMaterial color={colors.ink} transparent opacity={fade} depthWrite={false} />
      </lineSegments>
    </>
  )
}

// Stacks of thin slabs, one stack per region per stage, from /api/pipeline.
// Draw calls: slabs + backorder slabs + collapsed boxes + circles/arrows + dotted circle = 5 (the labels are DOM).
export default function Pipeline() {
  const { data } = usePipeline()
  const colors = useThemeColors()
  const collapsed = useStore((st) => st.pipelineCollapsed)
  const fit = useZoneFit('.pipeline', PIPELINE_W, PIPELINE_H)

  const lines = useMemo(() => lineGeometry(), [])
  const dots = useMemo(() => transitDots(), [])
  const layout = useMemo(() => (data ? pipelineLayout(data) : null), [data])
  if (!fit || !data || !layout) return null
  const at = ([x, y]: Pt) => [...lay(x, y), 0] as [number, number, number]
  const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? id
  return (
    <group position={fit.position} scale={fit.scale}>
      <Slabs layout={layout} collapsed={collapsed} />
      <lineSegments geometry={lines} position-z={0.2}>
        <lineBasicMaterial color={colors.ink} />
      </lineSegments>
      <points geometry={dots} position-z={0.2}>
        <pointsMaterial color={colors.ink} size={1.6} sizeAttenuation={false} />
      </points>
      {/* Text is DOM (rule 5): each label is a small DOM piece pinned to a point in the scene. */}
      {layout.stacks.map((st) => (
        <Fragment key={`${st.stage}-${st.region}`}>
          <Label at={at(countAt(st))} hidden={collapsed && COLLAPSIBLE.includes(st.stage)}>
            <StackCount value={st.count} />
          </Label>
          <Label at={at(nameAt(st))} hidden={collapsed && COLLAPSIBLE.includes(st.stage)}>
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
      {COLLAPSIBLE.map((stage) => (
        <Label key={stage} at={at(boxCenter(collapsedBox(stage)))} hidden={!collapsed}>
          <StageTotal value={layout.totals[stage as 'ordered' | 'packed']} />
        </Label>
      ))}
      {/* Callout 1: the Store circle is the button. It fills the circle, so the click target is the circle. */}
      <Label at={at([STORE.cx, STORE.cy])} interactive>
        <div style={{ width: STORE.r * 2 * fit.scale, height: STORE.r * 2 * fit.scale }}>
          <StoreButton />
        </div>
      </Label>
      <Label at={at([TRANSIT.cx, TRANSIT.cy])}>
        <CircleLabel text={fmt(data.inTransit)} />
      </Label>
    </group>
  )
}
