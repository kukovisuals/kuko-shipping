// The one projection helper (architecture rule 6). Nothing else projects coordinates.
// Albers USA with Alaska and Hawaii insets, sized for a 975 x 610 canvas
// (the same numbers us-atlas uses for its pre-projected files).
import { geoAlbersUsa } from 'd3-geo'

export const MAP_W = 975
export const MAP_H = 610

// Raw projection: x right, y DOWN, origin top-left. Geometry code streams through it
// (it clips the insets correctly) and then calls toScene on each point.
export const albers = geoAlbersUsa().scale(1300).translate([MAP_W / 2, MAP_H / 2])

// Scene units: map centered on the origin, y UP (three.js), one unit = one projected pixel.
export const toScene = (x: number, y: number): [number, number] => [x - MAP_W / 2, MAP_H / 2 - y]

// null when the point is off the map (outside the US and its insets).
export function project(lat: number, lng: number): [number, number] | null {
  const p = albers([lng, lat])
  return p ? toScene(p[0], p[1]) : null
}
