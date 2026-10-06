import { REGIONS, regionOf, type Region } from "@/domain/map/regions";
import type { Truck, TruckOrder } from "@/domain/ship/trucks";

// One line per region for the map's panel and ring: its open orders by status and the trucks to
// look at first.

export type OpenStatus = "on_time" | "at_risk" | "late";
export const OPEN_STATUSES = ["on_time", "at_risk", "late"] as const satisfies readonly OpenStatus[];

export type RegionSummary<K extends Truck<TruckOrder>> = {
  region: Region;
  /** Orders not delivered yet, by status. */
  orders: Record<OpenStatus, number>;
  open: number;
  /** Share of open orders on time, 0–1; null with nothing open. */
  onTimeRate: number | null;
  trucks: number;
  /** Late and at-risk trucks: late by most days late, then at risk, then biggest load. */
  problems: K[];
};

/** Days late of the latest open order on the truck. */
export function truckDaysLate(t: Truck<TruckOrder>): number {
  return Math.max(0, ...t.orders.filter((o) => o.deliveredAt === null).map((o) => o.delay.daysLate));
}

function compareProblems(a: Truck<TruckOrder>, b: Truck<TruckOrder>): number {
  const rank = (t: Truck<TruckOrder>) => (t.status === "late" ? 0 : 1);
  return rank(a) - rank(b) || truckDaysLate(b) - truckDaysLate(a) || b.open - a.open || (a.key < b.key ? -1 : 1);
}

export function summarizeRegions<K extends Truck<TruckOrder>>(trucks: readonly K[]): Record<Region, RegionSummary<K>> {
  const out = Object.fromEntries(
    REGIONS.map((region) => [
      region,
      { region, orders: { on_time: 0, at_risk: 0, late: 0 }, open: 0, onTimeRate: null, trucks: 0, problems: [] },
    ]),
  ) as unknown as Record<Region, RegionSummary<K>>;

  for (const t of trucks) {
    const r = out[regionOf(t.state)];
    r.trucks++;
    for (const o of t.orders) {
      if (o.deliveredAt !== null) continue;
      const s = o.delay.status;
      // An open order is never delivered_late; count it as late if the data ever says so.
      r.orders[s === "delivered_late" ? "late" : s]++;
      r.open++;
    }
    if (t.status === "late" || t.status === "at_risk") r.problems.push(t);
  }
  for (const r of Object.values(out)) {
    r.onTimeRate = r.open === 0 ? null : r.orders.on_time / r.open;
    r.problems.sort(compareProblems);
  }
  return out;
}
