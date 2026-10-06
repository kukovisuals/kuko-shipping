import { clamp } from "@/domain/map/bounds";
import { MAP, project, type LatLng, type Vec3 } from "@/domain/map/project";

// A truck route: a gentle curve on the ground from the warehouse to a state's anchor (a quadratic
// Bézier whose control point sits off the chord's middle). It bows toward the south-west — south
// going west, west going south — which from a north-east warehouse keeps roads over the interior
// and out of Canada and the Atlantic. Routes stay inside the lower 48: no date-line case.
export type Route = {
  a: Vec3;
  b: Vec3;
  /** Control point. */
  c: Vec3;
  /** Chord length. */
  length: number;
  /** Yaw about +Y that points +X along the chord (the curve's heading at its middle). */
  heading: number;
};

const yaw = (dx: number, dz: number) => Math.atan2(-dz, dx); // a Y rotation of θ turns +X into (cos θ, 0, −sin θ)

export function makeRoute(from: LatLng, to: LatLng, bend: number = MAP.routeBend): Route {
  const a = project(from);
  const b = project(to);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  // Of the chord's two quarter turns, (−dz, dx) and (dz, −dx), take the one further south-west (+z, −x).
  const s = dx + dz >= 0 ? 1 : -1;
  const c = { x: (a.x + b.x) / 2 - s * dz * bend * 2, y: 0, z: (a.z + b.z) / 2 + s * dx * bend * 2 };
  return { a, b, c, length: Math.hypot(dx, dz), heading: yaw(dx, dz) };
}

/** The ground point a share `t` of the way along, clamped to [0, 1]. */
export function routePoint({ a, b, c }: Route, t: number, y = 0): Vec3 {
  const u = clamp(t, 0, 1);
  const v = 1 - u;
  return { x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y, z: v * v * a.z + 2 * v * u * c.z + u * u * b.z };
}

/** The yaw that points a truck's +X along the curve at `t`. */
export function routeHeading({ a, b, c }: Route, t: number): number {
  const u = clamp(t, 0, 1);
  return yaw(2 * (1 - u) * (c.x - a.x) + 2 * u * (b.x - c.x), 2 * (1 - u) * (c.z - a.z) + 2 * u * (b.z - c.z));
}

/** The curve as `steps` straight segments, for drawing. */
export function routeSegments(route: Route, steps = 24, y = 0): [Vec3, Vec3][] {
  const pts = Array.from({ length: steps + 1 }, (_, i) => routePoint(route, i / steps, y));
  return pts.slice(1).map((p, i) => [pts[i], p]);
}
