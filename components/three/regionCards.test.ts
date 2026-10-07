import { describe, expect, it } from 'vitest'
import { END_MARGIN } from './laneLayout'
import { cardAnchors } from './regionCards'
import { usMap } from './usMapGeometry'

const map = usMap()
const anchors = cardAnchors(map)

describe('cardAnchors', () => {
  it('puts West, Midwest and NE cards above their region', () => {
    for (const r of ['WEST', 'MIDWEST', 'NE'] as const) {
      expect(anchors[r].y).toBeGreaterThan(map.bounds[r].maxY)
      expect(anchors[r].x).toBeGreaterThanOrEqual(map.bounds[r].minX)
      expect(anchors[r].x).toBeLessThanOrEqual(map.bounds[r].maxX)
    }
  })

  it('keeps South\'s card clear of its lanes, which end END_MARGIN past the east edge', () => {
    expect(anchors.SOUTH.x).toBeGreaterThan(map.eastEdge.SOUTH + END_MARGIN)
  })
})
