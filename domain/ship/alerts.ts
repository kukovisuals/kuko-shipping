import { daysLate, type Delay } from "@/domain/ship/delay";
import type { Ms } from "@/domain/time";

export type AlertCandidate = {
  id: string;
  placedAt: Ms;
  lastEventAt: Ms | null;
  ackAt: Ms | null;
  delay: Delay;
};

export function isAlert(delay: Delay): boolean {
  return delay.status === "late" || delay.status === "at_risk";
}

/** An ack hides the alert until a newer event arrives or the shipment gets a day later. */
export function ackHides({ ackAt, lastEventAt, delay }: AlertCandidate): boolean {
  if (ackAt === null) return false;
  if (lastEventAt !== null && lastEventAt > ackAt) return false;
  return delay.daysLate <= daysLate(delay.promisedAt, ackAt);
}

/** Late first, most days late first; then at-risk; then oldest order first. */
export function compareAlerts(a: AlertCandidate, b: AlertCandidate): number {
  const rank = (c: AlertCandidate) => (c.delay.status === "late" ? 0 : 1);
  return (
    rank(a) - rank(b) ||
    b.delay.daysLate - a.delay.daysLate ||
    a.placedAt - b.placedAt ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export function buildAlerts<T extends AlertCandidate>(candidates: readonly T[]): T[] {
  return candidates.filter((c) => isAlert(c.delay) && !ackHides(c)).sort(compareAlerts);
}
