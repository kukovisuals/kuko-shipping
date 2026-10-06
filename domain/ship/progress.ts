import { clamp } from "@/domain/map/bounds";
import { DAY, type Ms } from "@/domain/time";

export const MAX_IN_TRANSIT_PROGRESS = 0.95;
export const DELIVERED_PIN_DAYS = 7;

/** How far along its route a shipment is, 0 at the warehouse to 1 at the destination. A late
 * shipment holds at 0.95 until it is delivered. */
export function progressAt(
  t: { shippedAt: Ms | null; deliveredAt: Ms | null; promisedAt: Ms },
  now: Ms,
): number {
  if (t.deliveredAt !== null) return 1;
  if (t.shippedAt === null) return 0;
  if (t.promisedAt <= t.shippedAt) return MAX_IN_TRANSIT_PROGRESS;
  return clamp((now - t.shippedAt) / (t.promisedAt - t.shippedAt), 0, MAX_IN_TRANSIT_PROGRESS);
}

/** A delivered shipment leaves a small pin for 7 days. */
export function deliveredPinVisible(deliveredAt: Ms, now: Ms): boolean {
  return now - deliveredAt <= DELIVERED_PIN_DAYS * DAY;
}
