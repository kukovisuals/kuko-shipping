import { clamp } from "@/domain/map/bounds";
import { project, type LatLng, type Vec3 } from "@/domain/map/project";

// A truck route: a straight line on the ground from the warehouse to a state's anchor. Routes stay
// inside the lower 48, so they never cross the date line.
export type Route = { a: Vec3; b: Vec3; length: number; /** Yaw about +Y that points +X along the route. */ heading: number };

export function makeRoute(from: LatLng, to: LatLng): Route {
  const a = project(from);
  const b = project(to);
  // A Y rotation of θ turns +X into (cos θ, 0, −sin θ).
  return { a, b, length: Math.hypot(b.x - a.x, b.z - a.z), heading: Math.atan2(-(b.z - a.z), b.x - a.x) };
}

/** The ground point a share `t` of the way along, clamped to [0, 1]. */
export function routePoint({ a, b }: Route, t: number, y = 0): Vec3 {
  const u = clamp(t, 0, 1);
  return { x: a.x + (b.x - a.x) * u, y, z: a.z + (b.z - a.z) * u };
}
