import { describe, expect, it } from 'vitest'
import type { Lanes } from '../../lib/hooks/types'
import { REGIONS, regionForState, type Region } from '../../lib/regions'
import { CITIES } from '../../prisma/cities'
import { CLEARANCE, LANE_GAP, MIN_SPOKE, SPOKE_ANGLE, laneLayout, type PlacedLane } from './laneLayout'
import { usMap, type Pt } from './usMapGeometry'

// Every capital gets a lane, with a week of on-time days and a week of late days, so the
// layout is checked at its most crowded. Warehouse: Newark, NJ (OPEN-08).
const data: Lanes = {
  computedAt: null,
  warehouses: [{ id: 'loc-1', name: 'NE Warehouse', city: 'Newark', region: 'NE', lat: 40.7357, lng: -74.1724 }],
  lanes: CITIES.flatMap(({ city, state, lat, lng }, i) =>
    (['ON_TIME', 'LATE'] as const).map((timing) => {
      const days = Array.from({ length: 7 }, (_, d) => ({
        date: '2026-10-01',
        ageDays: timing === 'LATE' ? d + 8 : d,
        shipments: 1 + ((i + d) % 9),
      }))
      return {
        id: `${state}-${timing}`,
        warehouseId: 'loc-1',
        region: regionForState(state),
        timing,
        shipments: days.reduce((n, d) => n + d.shipments, 0),
        days,
        points: [{ lat: 40.7357, lng: -74.1724 }, { lat, lng }],
        destinations: [{ lat, lng, city }],
      }
    }),
  ),
}

const map = usMap()
const { lanes } = laneLayout(data, map)

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1]
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0]

function pointToSegment(p: Pt, a: Pt, b: Pt) {
  const ab = sub(b, a)
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)))
  return Math.hypot(p[0] - a[0] - ab[0] * t, p[1] - a[1] - ab[1] * t)
}

function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  const d1 = cross(sub(b, a), sub(c, a))
  const d2 = cross(sub(b, a), sub(d, a))
  const d3 = cross(sub(d, c), sub(a, c))
  const d4 = cross(sub(d, c), sub(b, c))
  return d1 * d2 < 0 && d3 * d4 < 0
}

function segmentDistance(a: Pt, b: Pt, c: Pt, d: Pt) {
  if (segmentsCross(a, b, c, d)) return 0
  return Math.min(pointToSegment(a, c, d), pointToSegment(b, c, d), pointToSegment(c, a, b), pointToSegment(d, a, b))
}

function inside(p: Pt, rings: Pt[][]) {
  let hit = false
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [a, b] = [ring[i], ring[j]]
      if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
    }
  return hit
}

// Closest a lane comes to any state edge of another region.
function distanceToRegion(lane: PlacedLane, region: Region) {
  let min = Infinity
  for (const ring of map.rings[region])
    for (let i = 0; i < ring.length; i++) min = Math.min(min, segmentDistance(lane.from, lane.to, ring[i], ring[(i + 1) % ring.length]))
  return min
}

const pairs = lanes.flatMap((a, i) => lanes.slice(i + 1).map((b) => [a, b] as const))

describe('laneLayout', () => {
  it('draws one lane per capital, each running from its start to the city', () => {
    expect(lanes).toHaveLength(CITIES.length)
    for (const l of lanes) {
      expect(Math.hypot(l.from[0] - l.to[0], l.from[1] - l.to[1]), l.city).toBeGreaterThanOrEqual(l.spoke ? MIN_SPOKE - 1e-6 : 40)
      if (!l.spoke) {
        expect(l.from[1]).toBe(l.to[1])
        expect(l.from[0]).toBeGreaterThan(l.to[0]) // flows west to the city
      }
    }
  })

  it('never lets two horizontal lanes overlap', () => {
    for (const [a, b] of pairs) {
      if (a.spoke || b.spoke) continue
      const sideBySide = Math.min(a.from[0], b.from[0]) > Math.max(a.to[0], b.to[0])
      if (sideBySide) expect(Math.abs(a.to[1] - b.to[1]), `${a.city} vs ${b.city}`).toBeGreaterThanOrEqual(LANE_GAP - 1e-6)
    }
  })

  it('fans spokes apart so no two lie on top of each other', () => {
    const spokes = lanes.filter((l) => l.spoke)
    expect(spokes.length).toBeGreaterThan(1)
    const angle = (l: PlacedLane) => Math.atan2(l.to[1] - l.from[1], l.to[0] - l.from[0])
    for (const [a, b] of pairs) {
      if (!a.spoke || !b.spoke) continue
      const diff = Math.abs(angle(a) - angle(b))
      expect(Math.min(diff, 2 * Math.PI - diff)).toBeGreaterThanOrEqual(SPOKE_ANGLE - 1e-6)
    }
  })

  it('keeps spokes and horizontal lanes apart', () => {
    for (const [a, b] of pairs) {
      if (a.spoke === b.spoke) continue
      expect(segmentDistance(a.from, a.to, b.from, b.to)).toBeGreaterThanOrEqual(LANE_GAP - 1e-6)
    }
  })

  it('never lets a lane touch another region', () => {
    for (const lane of lanes)
      for (const { id } of REGIONS) {
        if (id === lane.region) continue
        const where = `${lane.city} (${lane.region}) lane vs ${id}`
        expect(inside(lane.to, map.rings[id]), where).toBe(false)
        expect(distanceToRegion(lane, id), where).toBeGreaterThanOrEqual(CLEARANCE - 1e-6)
      }
  })
})
