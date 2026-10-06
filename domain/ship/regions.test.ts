import { describe, expect, it } from "vitest";
import type { StateCode } from "@/domain/map/usStates";
import type { DelayStatus } from "@/domain/ship/status";
import { loadTrucks, type TruckOrder } from "@/domain/ship/trucks";
import { DAY } from "@/domain/time";
import { summarizeRegions, truckDaysLate } from "./regions";

const NOW = Date.UTC(2026, 9, 6, 15);
let n = 0;
function order(state: StateCode, status: DelayStatus, opts: { daysLate?: number; day?: number; delivered?: boolean } = {}): TruckOrder {
  return {
    id: `o${n++}`,
    origin: "W01",
    state,
    shippedAt: NOW - (opts.day ?? 1) * DAY,
    deliveredAt: opts.delivered ? NOW - 1000 : null,
    delay: { status, promisedAt: NOW, daysLate: opts.daysLate ?? 0, remainingMs: null, reason: "" },
  };
}

describe("summarizeRegions", () => {
  const trucks = loadTrucks(
    [
      order("CO", "late", { daysLate: 3 }),
      order("CO", "on_time"),
      order("AZ", "late", { daysLate: 1 }),
      order("CA", "at_risk"),
      order("CA", "on_time", { day: 2 }),
      order("WA", "delivered_late", { delivered: true, day: 3 }),
      order("WA", "on_time", { day: 3 }),
      order("NY", "on_time"),
      order("NY", "on_time", { delivered: true }),
    ],
    NOW,
  );
  const s = summarizeRegions(trucks);

  it("counts open orders per region by status and skips delivered ones", () => {
    expect(s.west.orders).toEqual({ on_time: 3, at_risk: 1, late: 2 });
    expect(s.west.open).toBe(6);
    expect(s.west.onTimeRate).toBeCloseTo(0.5, 10);
    expect(s.northeast.orders).toEqual({ on_time: 1, at_risk: 0, late: 0 });
    expect(s.northeast.onTimeRate).toBe(1);
  });

  it("has no rate for a region with nothing open", () => {
    expect(s.south).toMatchObject({ open: 0, onTimeRate: null, trucks: 0, problems: [] });
  });

  it("lists late trucks by days late, then at-risk ones", () => {
    expect(s.west.problems.map((t) => [t.state, t.status])).toEqual([
      ["CO", "late"],
      ["AZ", "late"],
      ["CA", "at_risk"],
    ]);
    expect(truckDaysLate(s.west.problems[0])).toBe(3);
  });

  it("counts every truck in its region", () => {
    expect(s.west.trucks).toBe(5);
    expect(s.northeast.trucks).toBe(1);
  });
});
