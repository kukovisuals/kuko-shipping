'use client'

import { Color } from 'three'
import { REGIONS, type Region } from '@/lib/regions'
import { useStore } from '@/lib/store'
import { smooth, useTween } from './useTween'

// How much each region is faded: 0 = full strength, 1 = fully faded.
// Callout 2 (wiki 11): with a region selected, every other region fades; nothing selected, none do.
export function useRegionDims(): Record<Region, number> {
  const selected = useStore((s) => s.selectedRegion)
  const values = useTween(REGIONS.map(({ id }) => (selected !== null && selected !== id ? 1 : 0)))
  return Object.fromEntries(REGIONS.map(({ id }, i) => [id, smooth(values[i])])) as Record<Region, number>
}

// A faded region keeps its shape and pattern, only its colour moves toward the page.
const FADE = 0.7
const a = new Color()
const b = new Color()
export function dimColor(color: string, bg: string, dim: number): string {
  if (dim === 0) return color
  return `#${a.set(color).lerp(b.set(bg), FADE * dim).getHexString()}`
}
