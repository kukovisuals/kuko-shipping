// Where everything in the pipeline column goes. Pure: counts in, boxes out.
// Layout units: origin top-left, y DOWN, one unit = one pixel before the zone fit.
// The DOM labels (counts, stage names) read the same boxes, so they stay beside the stacks.
import { REGIONS, type Region } from '../../lib/regions'
import type { Pipeline } from '../../lib/hooks/types'

export const PIPELINE_W = 260
export const PIPELINE_H = 640

export type Stage = 'ordered' | 'backorder' | 'packed'
export type StackBox = { stage: Stage; region: Region; count: number; x: number; base: number; w: number; h: number }
export type Circle = { cx: number; cy: number; r: number }

// Every stack uses the same scale, so a stack twice as tall holds twice as many orders.
const TALLEST = 130
// Rows of slabs in the tallest stack; each slab is one thin box.
export const SLAB_ROWS = 26

const STACK = { w: 44, gap: 8 }
const SMALL = { w: 24, gap: 6 }
export const ROW_BASE: Record<Stage, number> = { ordered: 270, backorder: 350, packed: 530 }
const ROW_X: Record<Stage, number> = { ordered: 0, backorder: 146, packed: 0 }

export const STORE: Circle = { cx: 100, cy: 40, r: 34 }
export const TRANSIT: Circle = { cx: 100, cy: 600, r: 34 }

export function pipelineLayout(p: Pipeline) {
  const tallest = Math.max(1, ...Object.values(p.ordered))
  const stacks: StackBox[] = (['ordered', 'backorder', 'packed'] as const).flatMap((stage) => {
    const { w, gap } = stage === 'backorder' ? SMALL : STACK
    return REGIONS.map(({ id }, i) => {
      const count = p[stage][id]
      return { stage, region: id, count, x: ROW_X[stage] + i * (w + gap), base: ROW_BASE[stage], w, h: (count / tallest) * TALLEST }
    })
  })
  return { stacks, pitch: TALLEST / SLAB_ROWS }
}
