import { describe, expect, it } from "vitest";
import type { StateCode } from "@/domain/map/usStates";
import { DAY, HOUR, parseIso } from "@/domain/time";
import { nextDayOrders, type NextDayOrder } from "./nextDay";

const NOW = Date.UTC(2026, 9, 6, 15);
const TODAY = Date.UTC(2026, 9, 6);

const order = (state: StateCode, placedAt: number, over: Partial<NextDayOrder> = {}): NextDayOrder => ({
  state,
  placedAt,
  shippedAt: null,
  deliveredAt: null,
  ...over,
});

describe("nextDayOrders", () => {
  const n = nextDayOrders(
    [
      order("CA", TODAY + HOUR),
      order("CA", TODAY + 2 * HOUR),
      order("WA", TODAY + 3 * HOUR),
      order("NY", TODAY + 4 * HOUR),
      order("TX", TODAY + 5 * HOUR),
      order("IL", TODAY + 6 * HOUR),
      order("FL", TODAY - 3 * HOUR), // yesterday, still at the warehouse
      order("FL", TODAY + HOUR, { shippedAt: NOW - HOUR }), // already left
      order("OH", NOW + HOUR), // not placed yet
    ],
    NOW,
  );

  it("counts today's unshipped orders per region for tomorrow's trucks", () => {
    expect(n.day).toBe(TODAY + DAY);
    expect(n.total).toBe(6);
    expect(n.regions.west.orders).toBe(3);
    expect(n.regions.west.share).toBe(0.5);
    expect(n.regions.northeast.orders).toBe(1);
    expect(n.regions.south.orders).toBe(1);
    expect(n.regions.midwest.orders).toBe(1);
  });

  it("lists states biggest first", () => {
    expect(n.regions.west.states).toEqual([
      { state: "CA", orders: 2 },
      { state: "WA", orders: 1 },
    ]);
  });

  it("counts earlier unshipped orders apart and skips shipped or future ones", () => {
    expect(n.waiting).toBe(1);
  });

  it("puts an order placed at 23:30 in New York into the next UTC day", () => {
    const placed = parseIso("2026-10-05T23:30:00-04:00"); // 03:30 UTC on 6 Oct
    expect(nextDayOrders([order("NY", placed)], NOW).total).toBe(1);
  });

  it("gives zero shares with nothing placed today", () => {
    const empty = nextDayOrders([], NOW);
    expect(empty.total).toBe(0);
    expect(empty.regions.south).toEqual({ region: "south", orders: 0, share: 0, states: [] });
  });
});
