import { describe, expect, it } from "vitest";
import { arcPoint, makeArc } from "@/domain/map/arc";
import { DAY, HOUR } from "@/domain/time";
import { MAX_IN_TRANSIT_PROGRESS, deliveredPinVisible, dronePosition, progressAt } from "./progress";

const SHIPPED = Date.UTC(2026, 8, 2);
const PROMISED = SHIPPED + 4 * DAY;
const base = { shippedAt: SHIPPED, deliveredAt: null, promisedAt: PROMISED };

describe("progressAt", () => {
  it("is 0 before shipping — the drone sits at the warehouse", () => {
    expect(progressAt({ ...base, shippedAt: null }, SHIPPED + DAY)).toBe(0);
  });

  it("is 1 once delivered", () => {
    expect(progressAt({ ...base, deliveredAt: SHIPPED + 2 * DAY }, SHIPPED + 2 * DAY)).toBe(1);
  });

  it("moves linearly from shipped to promised", () => {
    expect(progressAt(base, SHIPPED)).toBe(0);
    expect(progressAt(base, SHIPPED + DAY)).toBeCloseTo(0.25, 10);
    expect(progressAt(base, SHIPPED + 2 * DAY)).toBeCloseTo(0.5, 10);
  });

  it("holds at 0.95 near and past the promise (a late drone waits)", () => {
    expect(progressAt(base, PROMISED - HOUR)).toBe(MAX_IN_TRANSIT_PROGRESS);
    expect(progressAt(base, PROMISED + 3 * DAY)).toBe(MAX_IN_TRANSIT_PROGRESS);
  });

  it("is 0.95 when the promise is at or before shipping", () => {
    expect(progressAt({ ...base, promisedAt: SHIPPED }, SHIPPED + HOUR)).toBe(MAX_IN_TRANSIT_PROGRESS);
    expect(progressAt({ ...base, promisedAt: SHIPPED - DAY }, SHIPPED)).toBe(MAX_IN_TRANSIT_PROGRESS);
  });

  it("never goes below 0 if now is before shipped_at", () => {
    expect(progressAt(base, SHIPPED - HOUR)).toBe(0);
  });
});

describe("dronePosition", () => {
  const arc = makeArc({ lat: 0, lng: 0 }, { lat: 0, lng: 100 });

  it("is an estimate along the arc without a scan position", () => {
    const p = dronePosition(arc, 0.5, null);
    expect(p.estimated).toBe(true);
    expect(p).toMatchObject(arcPoint(arc, 0.5));
  });

  it("sits at the scan point, lifted to the arc's height at the nearest t", () => {
    const p = dronePosition(arc, 0.1, { lat: 5, lng: 25 });
    expect(p.estimated).toBe(false);
    expect(p.x).toBe(25);
    expect(p.z).toBe(-5);
    expect(p.t).toBeCloseTo(0.25, 10);
    expect(p.y).toBeCloseTo(arcPoint(arc, 0.25).y, 10);
  });
});

describe("deliveredPinVisible", () => {
  it("keeps the pin for 7 days after delivery", () => {
    const delivered = Date.UTC(2026, 8, 10);
    expect(deliveredPinVisible(delivered, delivered + 7 * DAY)).toBe(true);
    expect(deliveredPinVisible(delivered, delivered + 7 * DAY + 1)).toBe(false);
  });
});
