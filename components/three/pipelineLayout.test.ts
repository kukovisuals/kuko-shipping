import { describe, expect, it } from 'vitest'
import type { Pipeline } from '../../lib/hooks/types'
import { PIPELINE_W, boxCenter, collapsedBox, pipelineLayout, slabPose } from './pipelineLayout'

const data: Pipeline = {
  computedAt: null,
  ordered: { WEST: 400, MIDWEST: 200, NE: 100, SOUTH: 300 },
  backorder: { WEST: 40, MIDWEST: 20, NE: 10, SOUTH: 30 },
  packed: { WEST: 360, MIDWEST: 180, NE: 90, SOUTH: 270 },
  inTransit: 0,
}

describe('pipelineLayout', () => {
  const { stacks } = pipelineLayout(data)
  const box = (stage: string, region: string) => stacks.find((s) => s.stage === stage && s.region === region)!

  it('makes one stack per region per stage', () => {
    expect(stacks).toHaveLength(12)
  })

  it('scales every stack the same: height is proportional to count', () => {
    expect(box('ordered', 'WEST').h).toBeCloseTo(2 * box('ordered', 'MIDWEST').h)
    expect(box('packed', 'SOUTH').h / 270).toBeCloseTo(box('backorder', 'WEST').h / 40)
  })

  it('keeps stacks inside the column', () => {
    for (const s of stacks) expect(s.x + s.w).toBeLessThanOrEqual(PIPELINE_W)
  })

  describe('collapse (callout 1)', () => {
    const { totals, pitch } = pipelineLayout(data)
    const ordered = stacks.filter((s) => s.stage === 'ordered')

    it('totals the stacks of each collapsible stage', () => {
      expect(totals.ordered).toBe(Object.values(data.ordered).reduce((a, b) => a + b, 0))
      expect(totals.packed).toBe(Object.values(data.packed).reduce((a, b) => a + b, 0))
    })

    it('puts every slab inside the box when fully collapsed, and on its stack when not', () => {
      for (const s of stacks.filter((s) => s.stage !== 'backorder')) {
        const box = collapsedBox(s.stage)
        const rows = Math.max(1, Math.round(s.h / pitch))
        for (let row = 0; row < rows; row++) {
          const open = slabPose(s, row, rows, 0, pitch)
          expect(open.cx).toBeCloseTo(s.x + s.w / 2)
          expect(open.y).toBeCloseTo(s.base - pitch * (row + 0.5))
          const shut = slabPose(s, row, rows, 1, pitch)
          expect(shut.cx).toBeCloseTo(boxCenter(box)[0])
          expect(shut.w).toBeCloseTo(box.w)
          expect(shut.y).toBeLessThan(box.base)
          expect(shut.y).toBeGreaterThan(box.base - box.h)
        }
      }
    })

    it('leaves backorder stacks where they are', () => {
      const b = stacks.find((s) => s.stage === 'backorder')!
      expect(slabPose(b, 0, 1, 1, pitch)).toEqual(slabPose(b, 0, 1, 0, pitch))
    })

    it('makes a box wide enough for all four stacks, inside the column', () => {
      const box = collapsedBox('ordered')
      expect(box.x).toBeLessThanOrEqual(ordered[0].x)
      expect(box.x + box.w).toBeGreaterThanOrEqual(ordered[3].x + ordered[3].w)
      expect(box.x + box.w).toBeLessThanOrEqual(PIPELINE_W)
    })
  })
})
