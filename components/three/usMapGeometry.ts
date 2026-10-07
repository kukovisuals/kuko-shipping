// Builds the US map geometry once: 4 region meshes + 2 line sets (wiki 10, steps 1-6).
// Pure data in, THREE geometry out. Every point goes through lib/project.ts.
import { geoStream, type GeoPermissibleObjects } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification'
import { BufferGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import atlas from 'us-atlas/states-10m.json'
import { MAP_H, MAP_W, albers, toScene } from '../../lib/project'
import { REGIONS, regionForFips, type Region } from '../../lib/regions'

export type Pt = [number, number]

const topology = atlas as unknown as Topology
const states = topology.objects.states as GeometryCollection

// Territories (and anything else) belong to no region and are not drawn.
function regionOf(fips: unknown): Region | null {
  try {
    return regionForFips(String(fips))
  } catch {
    return null
  }
}

const area = (ring: Pt[]) => {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

// Stream a geometry through the projection and collect its polygons (as lists of rings).
function projectedPolygons(geo: GeoPermissibleObjects): Pt[][][] {
  const polygons: Pt[][][] = []
  let rings: Pt[][] = []
  let ring: Pt[] = []
  geoStream(
    geo,
    albers.stream({
      point: (x, y) => ring.push(toScene(x, y)),
      lineStart: () => (ring = []),
      lineEnd: () => {
        const [first, last] = [ring[0], ring[ring.length - 1]]
        if (first && last && first[0] === last[0] && first[1] === last[1]) ring.pop()
        if (ring.length >= 3) rings.push(ring)
      },
      polygonStart: () => (rings = []),
      polygonEnd: () => polygons.push(rings),
      sphere: () => {},
    }),
  )
  return polygons
}

// The biggest ring sets the outer direction; rings turning the other way are holes.
function polygonShapes(rings: Pt[][]): Shape[] {
  if (rings.length === 0) return []
  const areas = rings.map(area)
  const outerSign = Math.sign(areas[areas.indexOf(areas.reduce((m, a) => (Math.abs(a) > Math.abs(m) ? a : m)))])
  const shapes = rings.filter((_, i) => Math.sign(areas[i]) === outerSign).map(
    (r) => ({ shape: new Shape(r.map(([x, y]) => new Vector2(x, y))), ring: r }),
  )
  rings.forEach((r, i) => {
    if (Math.sign(areas[i]) === outerSign) return
    const [px, py] = r[0]
    const host = shapes.find(({ ring }) => {
      const xs = ring.map((p) => p[0])
      const ys = ring.map((p) => p[1])
      return px >= Math.min(...xs) && px <= Math.max(...xs) && py >= Math.min(...ys) && py <= Math.max(...ys)
    })
    host?.shape.holes.push(new Path(r.map(([x, y]) => new Vector2(x, y))))
  })
  return shapes.map(({ shape }) => shape)
}

// Regions are drawn apart (D-009): each is nudged away from the others, in map units.
export const GAP = 48
const REGION_OFFSET: Record<Region, Pt> = {
  WEST: [-GAP, 0],
  MIDWEST: [0, GAP * 0.7],
  NE: [GAP, GAP * 0.5],
  SOUTH: [0, -GAP],
}
// What the map needs in scene units: the map itself, the gaps between regions, and room for lanes past the east coast.
// The map group and the region cards both fit this box into the DOM's `.map` zone.
export const MAP_BOX = { w: MAP_W + 2 * GAP + 34, h: MAP_H + 2.5 * GAP }
export const regionOffset = (region: Region): Pt => REGION_OFFSET[region]

function regionPolygons(region: Region): Pt[][][] {
  return feature(topology, states)
    .features.filter((f) => regionOf(f.id) === region)
    .flatMap((f) => projectedPolygons(f))
}

// Every ring of a region's states, already moved by the region's offset. Lanes use these to stay clear.
function regionRings(region: Region): Pt[][] {
  const [dx, dy] = REGION_OFFSET[region]
  return regionPolygons(region).flatMap((rings) => rings.map((ring) => ring.map(([x, y]): Pt => [x + dx, y + dy])))
}

function regionGeometry(region: Region): BufferGeometry {
  const parts = regionPolygons(region)
    .flatMap(polygonShapes)
    .map((shape) => new ShapeGeometry(shape))
  // Merging is what keeps this at 4 draw calls instead of ~50.
  const merged = mergeGeometries(parts)!
  merged.translate(...REGION_OFFSET[region], 0)
  return merged
}

type LinePart = { filter: (a: GeometryObject, b: GeometryObject) => boolean; offset: Pt }

// Border lines for several regions in one geometry (one draw call), each nudged by its region's offset.
function lineGeometry(parts: LinePart[]): BufferGeometry {
  const positions: number[] = []
  for (const { filter, offset } of parts) {
    let prev: Pt | null = null
    geoStream(
      mesh(topology, states, filter),
      albers.stream({
        point: (x, y) => {
          const [px, py] = toScene(x, y)
          const p: Pt = [px + offset[0], py + offset[1]]
          if (prev) positions.push(prev[0], prev[1], 0, p[0], p[1], 0)
          prev = p
        },
        lineStart: () => (prev = null),
        lineEnd: () => (prev = null),
        polygonStart: () => {},
        polygonEnd: () => {},
        sphere: () => {},
      }),
    )
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

export type UsMap = {
  regions: { id: Region; geometry: BufferGeometry }[]
  // Borders between states of the same region.
  stateBorders: BufferGeometry
  // Each region's whole outline: its coast plus the edges it shares with other regions.
  regionOutlines: BufferGeometry
  // Easternmost point of each region (after the gap offset), where its horizontal lanes end.
  eastEdge: Record<Region, number>
  // Each region's state rings in scene units (after the gap offset).
  rings: Record<Region, Pt[][]>
  // Each region's bounding box in scene units (after the gap offset, y up).
  bounds: Record<Region, { minX: number; maxX: number; minY: number; maxY: number }>
}

let cached: UsMap | null = null

export function usMap(): UsMap {
  if (!cached) {
    const regions = REGIONS.map(({ id }) => ({ id, geometry: regionGeometry(id) }))
    const eastEdge = Object.fromEntries(
      regions.map(({ id, geometry }) => {
        geometry.computeBoundingBox()
        return [id, geometry.boundingBox!.max.x]
      }),
    ) as Record<Region, number>
    const bounds = Object.fromEntries(
      regions.map(({ id, geometry }) => {
        const { min, max } = geometry.boundingBox!
        return [id, { minX: min.x, maxX: max.x, minY: min.y, maxY: max.y }]
      }),
    ) as UsMap['bounds']
    const inRegion = (r: Region, o: GeometryObject) => regionOf(o.id) === r
    cached = {
      regions,
      eastEdge,
      bounds,
      rings: Object.fromEntries(REGIONS.map(({ id }) => [id, regionRings(id)])) as Record<Region, Pt[][]>,
      stateBorders: lineGeometry(
        REGIONS.map(({ id }) => ({
          filter: (a, b) => a !== b && inRegion(id, a) && inRegion(id, b),
          offset: REGION_OFFSET[id],
        })),
      ),
      regionOutlines: lineGeometry(
        REGIONS.map(({ id }) => ({
          filter: (a, b) => inRegion(id, a) !== inRegion(id, b) || (a === b && inRegion(id, a)),
          offset: REGION_OFFSET[id],
        })),
      ),
    }
  }
  return cached
}
