'use client'

import { useSyncExternalStore } from 'react'

export type Zone = { x: number; y: number; w: number; h: number }

let last: Zone | null = null

// The map column's box, in canvas pixels (top-left origin). The DOM layout decides
// where the map goes; the Canvas just fits into it.
function getZone(): Zone | null {
  const map = document.querySelector('.map')
  const layer = document.querySelector('.canvas-layer')
  if (!map || !layer) return last
  const m = map.getBoundingClientRect()
  const l = layer.getBoundingClientRect()
  const next = { x: m.left - l.left, y: m.top - l.top, w: m.width, h: m.height }
  const same = last && last.x === next.x && last.y === next.y && last.w === next.w && last.h === next.h
  return same ? last : (last = next)
}

function subscribe(notify: () => void) {
  const observer = new ResizeObserver(notify)
  document.querySelectorAll('.map, .canvas-layer').forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}

export const useMapZone = () => useSyncExternalStore(subscribe, getZone, () => null)
