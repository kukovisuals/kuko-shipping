'use client'

import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'

export const smooth = (t: number) => t * t * (3 - 2 * t)

// Moves each number toward its target over `ms` (wiki 11: ~300 ms), and asks for a frame at every step
// (the Canvas only draws on demand). With reduced motion on, jumps to the end state at once.
// Returns the current values, so a component re-renders only while its own animation runs.
export function useTween(targets: number[], ms = 300): number[] {
  const reduced = usePrefersReducedMotion()
  const invalidate = useThree((s) => s.invalidate)
  const key = targets.join(',')
  const current = useRef(targets)
  const [values, setValues] = useState(targets)

  useEffect(() => {
    const to = key.split(',').map(Number)
    if (reduced) {
      current.current = to
      invalidate()
      return
    }
    const from = current.current
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      current.current = to.map((v, i) => from[i] + (v - from[i]) * k)
      setValues(current.current)
      invalidate()
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [key, reduced, ms, invalidate])

  // Reduced motion: no tween, the targets are the end state.
  return reduced ? targets : values
}
