// Equirectangular projection onto the X/Z ground plane, Y up. 1 scene unit = 1 degree.
export const MAP = {
  width: 360,
  height: 180,
  /** Thickness of the raised land slab; trucks, roads and borders sit on its top. */
  landHeight: 0.45,
  /** How far a route bows off its chord, as a share of the chord's length. */
  routeBend: 0.08,
} as const;

export type LatLng = { lat: number; lng: number };
export type Vec3 = { x: number; y: number; z: number };

// `0 - v` instead of `-v` so the equator and the prime meridian give 0, not -0.
export function project({ lat, lng }: LatLng, y = 0): Vec3 {
  return { x: lng, y, z: 0 - lat };
}

export function unproject({ x, z }: Pick<Vec3, "x" | "z">): LatLng {
  return { lat: 0 - z, lng: x };
}
