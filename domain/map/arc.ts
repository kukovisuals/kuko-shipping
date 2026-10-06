import { clamp } from "@/domain/map/bounds";
import { MAP, project, type LatLng, type Vec3 } from "@/domain/map/project";

// Quadratic Bézier from A to B with control C = midpoint + (0, 2h, 0); its peak is h at t = ½.
// Because C sits over the midpoint, the arc's ground track is the straight line A → B.
export type Arc = { a: Vec3; b: Vec3; c: Vec3; height: number; longWay: boolean };

export function arcHeight(distance: number): number {
  const { heightFactor, minHeight, maxHeight } = MAP.arc;
  return clamp(heightFactor * distance, minHeight, maxHeight);
}

export function makeArc(from: LatLng, to: LatLng): Arc {
  const a = project(from);
  const b = project(to);
  const height = arcHeight(Math.hypot(b.x - a.x, b.z - a.z));
  return {
    a,
    b,
    c: { x: (a.x + b.x) / 2, y: 2 * height, z: (a.z + b.z) / 2 },
    height,
    // MVP: routes over the date line are drawn the long way across the map, never wrapped.
    longWay: Math.abs(to.lng - from.lng) > 180,
  };
}

// Linear between p and q, clamped to them: rounding can never step past an endpoint, so a point on
// an arc between two map points is always on the map.
function lerp(p: number, q: number, t: number): number {
  return clamp((1 - t) * p + t * q, Math.min(p, q), Math.max(p, q));
}

/** P(t) = (1 − t)² A + 2 (1 − t) t C + t² B. With A, B at y = 0 and C over the midpoint this is
 * exactly a straight ground track plus y = 4h·t(1 − t), which is how it is computed: the
 * expanded Bézier drifts past ±180 by rounding at the map edges. */
export function arcPoint({ a, b, height }: Arc, t: number): Vec3 {
  return { x: lerp(a.x, b.x, t), y: 4 * height * t * (1 - t), z: lerp(a.z, b.z, t) };
}

/** The t whose ground position is closest to `p` (projection onto the segment A → B). */
export function nearestT({ a, b }: Arc, p: Pick<Vec3, "x" | "z">): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  if (len2 === 0) return 0;
  return clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / len2, 0, 1);
}

/** `segments + 1` points along the arc, for drawing it as a line. */
export function arcPoints(arc: Arc, segments: number): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) => arcPoint(arc, i / segments));
}
