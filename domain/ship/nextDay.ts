import { REGIONS, regionOf, type Region } from "@/domain/map/regions";
import type { StateCode } from "@/domain/map/usStates";
import { shipDayOf } from "@/domain/ship/trucks";
import { DAY, type Ms } from "@/domain/time";

// Tomorrow's trucks: every order leaves on the truck of the UTC day after it was placed (§3a), so
// the orders placed so far today and not shipped are what tomorrow's trucks will carry.
// TODO(owner): a same-day cut-off would move some of these onto today's truck.

export type NextDayOrder = { state: StateCode; placedAt: Ms; shippedAt: Ms | null; deliveredAt: Ms | null };

export type NextDayRegion = {
  region: Region;
  orders: number;
  /** Share of tomorrow's orders, 0–1; 0 when there are none. */
  share: number;
  /** States by orders, biggest first. */
  states: { state: StateCode; orders: number }[];
};

export type NextDay = {
  /** Start of the UTC day the trucks leave. */
  day: Ms;
  total: number;
  regions: Record<Region, NextDayRegion>;
  /** Orders placed before today and still not shipped: they belong on an earlier truck. */
  waiting: number;
};

export function nextDayOrders(orders: readonly NextDayOrder[], now: Ms): NextDay {
  const today = shipDayOf(now);
  const byState = Object.fromEntries(REGIONS.map((r) => [r, new Map<StateCode, number>()])) as Record<Region, Map<StateCode, number>>;
  let total = 0;
  let waiting = 0;
  for (const o of orders) {
    if (o.shippedAt !== null || o.deliveredAt !== null || o.placedAt > now) continue;
    if (o.placedAt < today) {
      waiting++;
      continue;
    }
    const states = byState[regionOf(o.state)];
    states.set(o.state, (states.get(o.state) ?? 0) + 1);
    total++;
  }
  const regions = Object.fromEntries(
    REGIONS.map((region) => {
      const states = [...byState[region]]
        .map(([state, n]) => ({ state, orders: n }))
        .sort((a, b) => b.orders - a.orders || (a.state < b.state ? -1 : 1));
      const n = states.reduce((sum, s) => sum + s.orders, 0);
      return [region, { region, orders: n, share: total === 0 ? 0 : n / total, states }];
    }),
  ) as Record<Region, NextDayRegion>;
  return { day: today + DAY, total, regions, waiting };
}
