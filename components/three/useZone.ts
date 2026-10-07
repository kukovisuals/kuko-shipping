'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useThree } from '@react-three/fiber'

export type Zone = { x: number; y: number; w: number; h: number }

const last = new Map<string, Zone>()

// A DOM element's box, in canvas pixels (top-left origin). The DOM layout decides
// where things go; the Canvas just fits into it.
function readZone(selector: string): Zone | null {
  const el = document.querySelector(selector)
  const layer = document.querySelector('.canvas-layer')
  if (!el || !layer) return last.get(selector) ?? null
  const m = el.getBoundingClientRect()
  const l = layer.getBoundingClientRect()
  const next = { x: m.left - l.left, y: m.top - l.top, w: m.width, h: m.height }
  const prev = last.get(selector)
  if (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h) return prev
  last.set(selector, next)
  return next
}

export function useZone(selector: string): Zone | null {
  const subscribe = useCallback(
    (notify: () => void) => {
      const observer = new ResizeObserver(notify)
      document.querySelectorAll(`${selector}, .canvas-layer`).forEach((el) => observer.observe(el))
      return () => observer.disconnect()
    },
    [selector],
  )
  return useSyncExternalStore(
    subscribe,
    () => readZone(selector),
    () => null,
  )
}

// Where a group of `w` x `h` scene units goes so it sits centered in the zone, as large as fits.
// Pure, so DOM pieces outside the Canvas (the region cards) can use the same numbers as the scene.
// cx, cy: the zone's center in canvas pixels, top-left origin.
export function fitToZone(zone: Zone, w: number, h: number, fill = 0.95) {
  return {
    scale: Math.min((zone.w * fill) / w, (zone.h * fill) / h),
    cx: zone.x + zone.w / 2,
    cy: zone.y + zone.h / 2,
  }
}

// In the Canvas, as a group position: orthographic camera at zoom 1, one world unit is one canvas pixel,
// origin at the center.
export function useZoneFit(selector: string, w: number, h: number, fill = 0.95) {
  const zone = useZone(selector)
  const { width, height } = useThree((s) => s.size)
  if (!zone) return null
  const { scale, cx, cy } = fitToZone(zone, w, h, fill)
  return { scale, position: [cx - width / 2, height / 2 - cy, 0] as [number, number, number] }
}
