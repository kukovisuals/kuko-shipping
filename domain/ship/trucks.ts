import type { StateCode } from "@/domain/map/usStates";
import type { Delay } from "@/domain/ship/delay";
import { MAX_IN_TRANSIT_PROGRESS, progressAt } from "@/domain/ship/progress";
import { DELAY_STATUSES, type DelayStatus } from "@/domain/ship/status";
import { DAY, type Ms } from "@/domain/time";

// A truck is how the map draws shipments: every order leaving one warehouse for one state on one
// ship day rides the same truck. Orders stay separate shipments everywhere else (alerts, cards).

export type TruckOrder = {
  id: string;
  origin: string; // warehouse id
  state: StateCode;
  shippedAt: Ms | null;
  deliveredAt: Ms | null;
  delay: Delay;
};

export type Truck<T extends TruckOrder> = {
  key: string;
  origin: string;
  state: StateCode;
  /** Start of the UTC ship day; null while the orders still wait at the warehouse. */
  shipDay: Ms | null;
  /** The earliest ship time in the load. */
  departedAt: Ms | null;
  /** Every order in the load, worst first. */
  orders: T[];
  /** Orders not delivered yet. A truck with none left is not drawn. */
  open: number;
  counts: Record<DelayStatus, number>;
  /** The worst status among its open orders: one late order makes the truck late. */
  status: DelayStatus;
  /** 0 at the warehouse, up to 0.95 on the way; a late truck holds at 0.95. Always an estimate. */
  progress: number;
};

const SEVERITY: Record<DelayStatus, number> = { on_time: 0, delivered_late: 1, at_risk: 2, late: 3 };

export function worstStatus(statuses: Iterable<DelayStatus>): DelayStatus {
  let worst: DelayStatus = "on_time";
  for (const s of statuses) if (SEVERITY[s] > SEVERITY[worst]) worst = s;
  return worst;
}

/** Start of the UTC day `at` falls in. */
export function shipDayOf(at: Ms): Ms {
  return Math.floor(at / DAY) * DAY;
}

/** Worst status first, then most days late, then id. */
export function compareOrders(a: TruckOrder, b: TruckOrder): number {
  return (
    SEVERITY[b.delay.status] - SEVERITY[a.delay.status] ||
    b.delay.daysLate - a.delay.daysLate ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** How far the truck has driven. It leaves with its first order and is due with its last promise. */
export function truckProgress(
  t: { departedAt: Ms | null; promisedAt: Ms; status: DelayStatus },
  now: Ms,
): number {
  if (t.departedAt === null) return 0;
  if (t.status === "late") return MAX_IN_TRANSIT_PROGRESS;
  return progressAt({ shippedAt: t.departedAt, deliveredAt: null, promisedAt: t.promisedAt }, now);
}

/** Groups orders into trucks by warehouse + state + ship day and keeps the ones still driving or
 * loading. Sorted worst status first, then biggest load. */
export function loadTrucks<T extends TruckOrder>(orders: readonly T[], now: Ms): Truck<T>[] {
  const groups = new Map<string, T[]>();
  for (const o of orders) {
    const day = o.shippedAt === null ? "loading" : String(shipDayOf(o.shippedAt));
    const key = `${o.origin}:${o.state}:${day}`;
    const list = groups.get(key);
    if (list) list.push(o);
    else groups.set(key, [o]);
  }

  const trucks: Truck<T>[] = [];
  for (const [key, list] of groups) {
    const openOrders = list.filter((o) => o.deliveredAt === null);
    if (openOrders.length === 0) continue;
    const counts = Object.fromEntries(DELAY_STATUSES.map((s) => [s, 0])) as Record<DelayStatus, number>;
    for (const o of list) counts[o.delay.status]++;
    const status = worstStatus(openOrders.map((o) => o.delay.status));
    const shipped = list.flatMap((o) => (o.shippedAt === null ? [] : [o.shippedAt]));
    const departedAt = shipped.length ? Math.min(...shipped) : null;
    const promisedAt = Math.max(...openOrders.map((o) => o.delay.promisedAt));
    trucks.push({
      key,
      origin: list[0].origin,
      state: list[0].state,
      shipDay: departedAt === null ? null : shipDayOf(departedAt),
      departedAt,
      orders: [...list].sort(compareOrders),
      open: openOrders.length,
      counts,
      status,
      progress: truckProgress({ departedAt, promisedAt, status }, now),
    });
  }
  return trucks.sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status] || b.orders.length - a.orders.length || (a.key < b.key ? -1 : 1));
}
