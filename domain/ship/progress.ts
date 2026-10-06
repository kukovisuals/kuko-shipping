import { arcPoint, nearestT, type Arc } from "@/domain/map/arc";
import { clamp } from "@/domain/map/bounds";
import { project, type LatLng, type Vec3 } from "@/domain/map/project";
import { DAY, type Ms } from "@/domain/time";

export const MAX_IN_TRANSIT_PROGRESS = 0.95;
export const DELIVERED_PIN_DAYS = 7;

/** How far along its arc a drone is, 0 at the warehouse to 1 at the destination. A late drone
 * holds at 0.95 until it is delivered. */
export function progressAt(
  t: { shippedAt: Ms | null; deliveredAt: Ms | null; promisedAt: Ms },
  now: Ms,
): number {
  if (t.deliveredAt !== null) return 1;
  if (t.shippedAt === null) return 0;
  if (t.promisedAt <= t.shippedAt) return MAX_IN_TRANSIT_PROGRESS;
  return clamp((now - t.shippedAt) / (t.promisedAt - t.shippedAt), 0, MAX_IN_TRANSIT_PROGRESS);
}

export type DronePosition = Vec3 & { t: number; estimated: boolean };

/** Where to draw the drone. With a scan position it sits at that point, lifted to the arc's height
 * at the nearest t; without one it is an estimate along the arc. */
export function dronePosition(arc: Arc, progress: number, scan: LatLng | null): DronePosition {
  if (scan) {
    const ground = project(scan);
    const t = nearestT(arc, ground);
    return { x: ground.x, y: arcPoint(arc, t).y, z: ground.z, t, estimated: false };
  }
  return { ...arcPoint(arc, progress), t: progress, estimated: true };
}

/** A delivered shipment leaves a small pin for 7 days. */
export function deliveredPinVisible(deliveredAt: Ms, now: Ms): boolean {
  return now - deliveredAt <= DELIVERED_PIN_DAYS * DAY;
}
