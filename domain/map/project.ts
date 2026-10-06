// Equirectangular projection onto the X/Z ground plane, Y up. 1 scene unit = 1 degree.
export const MAP = {
  width: 360,
  height: 180,
  landCellSize: 0.9,
  landCellHeight: 0.3,
  pinMergeDeg: 0.5,
  arc: { heightFactor: 0.25, minHeight: 2, maxHeight: 30 },
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
