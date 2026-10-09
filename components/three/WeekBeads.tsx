'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Matrix4, type InstancedMesh } from 'three'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { useStore } from '@/lib/store'
import type { Region } from '@/lib/regions'
import { beadGeometry, lateBeadGeometry } from './mapShapes'
import { advance, beadFrame, dayOf, WEEK } from './weekClock'

export type WeekBead = { x: number; y: number; x0: number; y0: number; age: number; r: number; late: boolean; region: Region; color: string }

const FRAME_CAP = 0.5 // seconds; a frame after a long idle (demand mode) must not jump the clock, but slow frames must not slow the week

// Order-day beads: late rings and on-time discs, two draw calls. Resting (not played yet) the clock sits at
// WEEK, which is the still map: late rings in their slots, no on-time discs. Play runs the loop (wiki 11):
// the beads leave the lane start and travel to their slots; on-time beads fade out on arrival.
export default function WeekBeads({ beads, bg }: { beads: WeekBead[]; bg: string }) {
  const playing = useStore((s) => s.weekPlaying)
  const reduced = usePrefersReducedMotion()
  const invalidate = useThree((s) => s.invalidate)
  const t = useRef(WEEK)
  const lateMesh = useRef<InstancedMesh>(null)
  const onTimeMesh = useRef<InstancedMesh>(null)

  const sets = useMemo(() => {
    const maxAge = Math.max(0, ...beads.map((b) => b.age))
    const pick = (late: boolean) => beads.filter((b) => b.late === late)
    return { maxAge, late: pick(true), onTime: pick(false) }
  }, [beads])

  const scratch = useMemo(() => ({ matrix: new Matrix4(), color: new Color(), page: new Color() }), [])

  // Puts every bead where the clock says. Colors only move for on-time beads (they fade).
  const draw = (clock: number) => {
    scratch.page.set(bg)
    for (const [mesh, list, late] of [[lateMesh.current, sets.late, true], [onTimeMesh.current, sets.onTime, false]] as const) {
      if (!mesh) continue
      list.forEach((b, i) => {
        const f = beadFrame(b.age, sets.maxAge, late, clock)
        const s = b.r * f.scale
        mesh.setMatrixAt(i, scratch.matrix.makeScale(s, s, 1).setPosition(b.x0 + (b.x - b.x0) * f.along, b.y0 + (b.y - b.y0) * f.along, 0.4))
        mesh.setColorAt(i, scratch.color.set(b.color).lerp(scratch.page, f.fade))
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    invalidate()
  }

  // New data, theme or fade: redraw at the current time.
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

  return (
    <>
      {sets.late.length > 0 && <instancedMesh key={`l${sets.late.length}`} ref={lateMesh} args={[lateBeadGeometry, undefined, sets.late.length]} frustumCulled={false}><meshBasicMaterial depthWrite={false} /></instancedMesh>}
      {sets.onTime.length > 0 && <instancedMesh key={`o${sets.onTime.length}`} ref={onTimeMesh} args={[beadGeometry, undefined, sets.onTime.length]} frustumCulled={false}><meshBasicMaterial depthWrite={false} /></instancedMesh>}
    </>
  )
}
