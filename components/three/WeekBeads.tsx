'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Matrix4, type InstancedMesh } from 'three'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { useStore } from '@/lib/store'
import type { Region } from '@/lib/regions'
import { lateBeadGeometry } from './mapShapes'
import { advance, beadFrame, dayOf, WEEK } from './weekClock'

export type WeekBead = { x: number; y: number; x0: number; y0: number; age: number; r: number; late: boolean; region: Region; color: string }

const FRAME_CAP = 0.5 // seconds; a frame after a long idle (demand mode) must not jump the clock, but slow frames must not slow the week

// Late order-day beads (the caller passes only those), one draw call. On-time orders are never drawn (D-013). Resting (not played yet) the
// clock sits at WEEK, which is the still map: every late ring in its slot. Play runs the loop (wiki 11):
// the rings leave the lane start and travel to their slots.
export default function WeekBeads({ beads }: { beads: WeekBead[] }) {
  const playing = useStore((s) => s.weekPlaying)
  const reduced = usePrefersReducedMotion()
  const invalidate = useThree((s) => s.invalidate)
  const t = useRef(WEEK)
  const lateMesh = useRef<InstancedMesh>(null)

  const ages = useMemo(() => ({ min: Math.min(...beads.map((b) => b.age)), max: Math.max(...beads.map((b) => b.age)) }), [beads])

  const scratch = useMemo(() => new Matrix4(), [])
  const color = useMemo(() => new Color(), [])

  // Puts every bead where the clock says.
  const draw = (clock: number) => {
    const mesh = lateMesh.current
    if (!mesh) return
    beads.forEach((b, i) => {
      const f = beadFrame(b.age, ages.min, ages.max, clock)
      const s = b.r * f.scale
      mesh.setMatrixAt(i, scratch.makeScale(s, s, 1).setPosition(b.x0 + (b.x - b.x0) * f.along, b.y0 + (b.y - b.y0) * f.along, 0.4))
      mesh.setColorAt(i, color.set(b.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    invalidate()
  }

  // New data or theme: redraw at the current time.
  useLayoutEffect(() => draw(t.current))

  // Pressing play starts a fresh week unless it was paused part-way.
  const active = playing && !reduced
  useLayoutEffect(() => {
    if (!active) return
    if (t.current >= WEEK) t.current = 0
    invalidate()
  }, [active, invalidate])

  useFrame((_, delta) => {
    if (!active) return
    t.current = advance(t.current, Math.min(delta, FRAME_CAP))
    const clock = Math.min(t.current, WEEK)
    draw(clock)
    useStore.getState().setWeekDay(dayOf(clock))
  })

  if (beads.length === 0) return null
  return (
    <instancedMesh key={beads.length} ref={lateMesh} args={[lateBeadGeometry, undefined, beads.length]} frustumCulled={false}>
      <meshBasicMaterial depthWrite={false} />
    </instancedMesh>
  )
}
