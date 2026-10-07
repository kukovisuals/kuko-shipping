import { describe, expect, it } from 'vitest'
import type { Pipeline } from '../../lib/hooks/types'
import { pipelineLayout } from './pipelineLayout'

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
    for (const s of stacks) expect(s.x + s.w).toBeLessThanOrEqual(260)
  })
})
