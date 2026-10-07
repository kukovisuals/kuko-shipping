// Where each region's card sits (design image): above West, Midwest and NE, and South's to the east
// of its lanes, where the map is empty. Pure: map bounds in, anchors out (scene units, y up).
import type { Region } from '../../lib/regions'
import { END_MARGIN } from './laneLayout'
import type { UsMap } from './usMapGeometry'

// `align` says which point of the card sits on the anchor: [0, 0] = its top-left, [0.5, 1] = bottom-center.
export type CardAnchor = { x: number; y: number; align: [number, number] }

export const CARD_GAP = 8
// South's card starts this far past where its lanes end, so arrowheads never touch it.
export const LANE_CLEARANCE = 26

export function cardAnchors({ bounds, eastEdge }: Pick<UsMap, 'bounds' | 'eastEdge'>): Record<Region, CardAnchor> {
  const above = (r: Region, along: number, align: number): CardAnchor => {
    const b = bounds[r]
    return { x: b.minX + (b.maxX - b.minX) * along, y: b.maxY + CARD_GAP, align: [align, 1] }
  }
  const south = bounds.SOUTH
  return {
    // Not the very edge: the Aleutians stretch West's box past the mainland.
    WEST: above('WEST', 0.1, 0),
    MIDWEST: above('MIDWEST', 0.35, 0.5),
    NE: above('NE', 0.5, 0.5),
    SOUTH: {
      x: eastEdge.SOUTH + END_MARGIN + LANE_CLEARANCE,
      y: south.minY + (south.maxY - south.minY) * 0.3,
      align: [0, 0.5],
    },
  }
}
