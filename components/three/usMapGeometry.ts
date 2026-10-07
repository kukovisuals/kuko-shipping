// Builds the US map geometry once: 4 region meshes + 2 line sets (wiki 10, steps 1-6).
// Pure data in, THREE geometry out. Every point goes through lib/project.ts.
import { geoStream, type GeoPermissibleObjects } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification'
import { BufferGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import atlas from 'us-atlas/states-10m.json'
import { albers, toScene } from '@/lib/project'
import { REGIONS, regionForFips, type Region } from '@/lib/regions'

type Pt = [number, number]

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

function regionGeometry(region: Region): BufferGeometry {
  const parts = feature(topology, states)
    .features.filter((f) => regionOf(f.id) === region)
    .flatMap((f) => projectedPolygons(f))
    .flatMap(polygonShapes)
    .map((shape) => new ShapeGeometry(shape))
  // Merging is what keeps this at 4 draw calls instead of ~50.
  return mergeGeometries(parts)!
}

function lineGeometry(filter: (a: GeometryObject, b: GeometryObject) => boolean): BufferGeometry {
  const positions: number[] = []
  let prev: Pt | null = null
  geoStream(
    mesh(topology, states, filter),
    albers.stream({
      point: (x, y) => {
        const p = toScene(x, y)
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
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return g
}

export type UsMap = {
  regions: { id: Region; geometry: BufferGeometry }[]
  stateBorders: BufferGeometry
  regionBorders: BufferGeometry
}

let cached: UsMap | null = null

export function usMap(): UsMap {
  cached ??= {
    regions: REGIONS.map(({ id }) => ({ id, geometry: regionGeometry(id) })),
    stateBorders: lineGeometry((a, b) => a !== b && !!regionOf(a.id) && !!regionOf(b.id)),
    regionBorders: lineGeometry((a, b) => {
      const [ra, rb] = [regionOf(a.id), regionOf(b.id)]
      return a !== b && !!ra && !!rb && ra !== rb
    }),
  }
  return cached
}
