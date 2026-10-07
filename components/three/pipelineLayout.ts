// Where everything in the pipeline column goes. Pure: counts in, boxes out.
// Layout units: origin top-left, y DOWN, one unit = one pixel before the zone fit.
// The geometry (stacks, arrows) and the DOM labels both read this file, so they stay together.
import { REGIONS, type Region } from '../../lib/regions'
import type { Pipeline } from '../../lib/hooks/types'

export const PIPELINE_W = 410
export const PIPELINE_H = 640

export type Stage = 'ordered' | 'backorder' | 'packed'
export type StackBox = { stage: Stage; region: Region; count: number; x: number; base: number; w: number; h: number }
export type Circle = { cx: number; cy: number; r: number }
export type Pt = [number, number]

// Every stack uses the same scale, so a stack twice as tall holds twice as many orders.
const TALLEST = 130
// Rows of slabs in the tallest stack; each slab is one thin box.
export const SLAB_ROWS = 26

// Left edge, stack width, and spacing between stacks (the same spacing keeps the region names apart).
const ROW = {
  ordered: { x: 0, w: 48, pitch: 64, base: 270 },
  backorder: { x: 180, w: 30, pitch: 64, base: 350 },
  packed: { x: 0, w: 48, pitch: 64, base: 530 },
} as const

export const STORE: Circle = { cx: 120, cy: 40, r: 34 }
export const TRANSIT: Circle = { cx: 120, cy: 602, r: 32 }

// Flow lines (D-010). The last point of a path with `arrow` gets an arrowhead pointing that way.
export const FLOWS: { path: Pt[]; arrow?: 'down' | 'left' }[] = [
  { path: [[120, 74], [120, 110]] }, // Store -> Ordered
  { path: [[120, 298], [120, 372]], arrow: 'down' }, // Ordered -> Packed (in stock)
  { path: [[244, 205], [291, 205], [291, 318]], arrow: 'down' }, // Ordered -> Backorder (no stock)
  { path: [[291, 376], [291, 500], [246, 500]], arrow: 'left' }, // Backorder -> Packed (restocked)
  { path: [[120, 556], [120, 570]] }, // Packed -> In transit
]

export const STAGE_TITLES: { text: string; at: Pt }[] = [
  { text: 'ORDERED', at: [0, 108] },
  { text: 'BACKORDER', at: [180, 308] },
  { text: 'PACKED', at: [0, 368] },
]

export const FLOW_NOTES: { text: string; at: Pt }[] = [
  { text: 'no stock', at: [298, 235] },
  { text: 'restocked', at: [298, 430] },
]

// Count label above a stack, region name below it (both centered on the stack).
export const countAt = (s: StackBox): Pt => [s.x + s.w / 2, s.base - s.h - 9]
export const nameAt = (s: StackBox): Pt => [s.x + s.w / 2, s.base + 12]

export function pipelineLayout(p: Pipeline) {
  const tallest = Math.max(1, ...Object.values(p.ordered))
  const stacks: StackBox[] = (['ordered', 'backorder', 'packed'] as const).flatMap((stage) => {
    const { x, w, pitch, base } = ROW[stage]
    return REGIONS.map(({ id }, i) => {
      const count = p[stage][id]
      return { stage, region: id, count, x: x + i * pitch, base, w, h: (count / tallest) * TALLEST }
    })
  })
  return { stacks, pitch: TALLEST / SLAB_ROWS }
}
