import { describe, expect, it } from "vitest";
import type { Delay } from "@/domain/ship/delay";
import type { DelayStatus } from "@/domain/ship/status";
import { DAY, HOUR } from "@/domain/time";
import { loadTrucks, shipDayOf, truckProgress, worstStatus, type TruckOrder } from "./trucks";

const NOW = Date.UTC(2026, 9, 6, 15);
const TODAY = Date.UTC(2026, 9, 6);
const YESTERDAY_DISPATCH = TODAY - DAY + 19 * HOUR;

let n = 0;
function order(over: Partial<TruckOrder> & { status?: DelayStatus; daysLate?: number; promisedAt?: number } = {}): TruckOrder {
  const { status = "on_time", daysLate = 0, promisedAt = YESTERDAY_DISPATCH + 4 * DAY, ...rest } = over;
  const delay: Delay = { status, daysLate, promisedAt, remainingMs: null, reason: "" };
  return { id: `o${++n}`, origin: "W01", state: "CA", shippedAt: YESTERDAY_DISPATCH, deliveredAt: null, delay, ...rest };
}

describe("worstStatus", () => {
  it("ranks late over at-risk over on-time", () => {
    expect(worstStatus(["on_time", "at_risk", "on_time"])).toBe("at_risk");
    expect(worstStatus(["at_risk", "late"])).toBe("late");
    expect(worstStatus([])).toBe("on_time");
  });
});

describe("shipDayOf", () => {
  it("counts days in UTC", () => {
    expect(shipDayOf(YESTERDAY_DISPATCH)).toBe(TODAY - DAY);
    // 23:30 in New York is already the next UTC day.
    expect(shipDayOf(Date.UTC(2026, 9, 6, 3, 30))).toBe(TODAY);
  });
});

describe("loadTrucks", () => {
  it("puts one state's orders from one ship day on one truck", () => {
    const trucks = loadTrucks([order(), order(), order({ state: "TX" })], NOW);
    expect(trucks).toHaveLength(2);
    expect(trucks.find((t) => t.state === "CA")?.orders).toHaveLength(2);
  });

  it("splits by ship day and by warehouse", () => {
    const trucks = loadTrucks(
      [order(), order({ shippedAt: YESTERDAY_DISPATCH - DAY }), order({ origin: "W02" })],
      NOW,
    );
    expect(trucks).toHaveLength(3);
  });

  it("keeps unshipped orders on a loading truck at the warehouse", () => {
    const [t] = loadTrucks([order({ shippedAt: null }), order({ shippedAt: null })], NOW);
    expect(t).toMatchObject({ shipDay: null, departedAt: null, progress: 0, open: 2 });
    expect(t.key).toBe("W01:CA:loading");
  });

  it("takes the worst open status: one late order makes the truck late", () => {
    const orders = [...Array.from({ length: 48 }, () => order()), order({ status: "late", daysLate: 2 }), order({ status: "late", daysLate: 1 })];
    const [t] = loadTrucks(orders, NOW);
    expect(t.status).toBe("late");
    expect(t.counts).toMatchObject({ late: 2, on_time: 48 });
    expect(t.orders[0].delay.daysLate).toBe(2); // worst first
    expect(t.progress).toBe(0.95);
  });

  it("ignores delivered orders for the colour and drops a fully delivered truck", () => {
    const delivered = { deliveredAt: NOW - HOUR, status: "delivered_late" as const };
    const [t] = loadTrucks([order(delivered), order()], NOW);
    expect(t.status).toBe("on_time");
    expect(t.open).toBe(1);
    expect(t.counts.delivered_late).toBe(1);
    expect(loadTrucks([order(delivered), order(delivered)], NOW)).toHaveLength(0);
  });

  it("sorts worst trucks first, then the biggest load", () => {
    const trucks = loadTrucks(
      [order({ state: "NY" }), order({ state: "NY" }), order({ state: "TX" }), order({ state: "FL", status: "at_risk" })],
      NOW,
    );
    expect(trucks.map((t) => t.state)).toEqual(["FL", "NY", "TX"]);
  });
});

describe("truckProgress", () => {
  const departedAt = TODAY - DAY;
  const promisedAt = departedAt + 4 * DAY;

  it("drives linearly from departure to the latest promise", () => {
    expect(truckProgress({ departedAt, promisedAt, status: "on_time" }, departedAt + DAY)).toBeCloseTo(0.25, 10);
    expect(truckProgress({ departedAt, promisedAt, status: "at_risk" }, departedAt + 10 * DAY)).toBe(0.95);
  });

  it("is 0 while loading and holds at 0.95 when late", () => {
    expect(truckProgress({ departedAt: null, promisedAt, status: "on_time" }, NOW)).toBe(0);
    expect(truckProgress({ departedAt, promisedAt, status: "late" }, departedAt + DAY)).toBe(0.95);
  });
});
