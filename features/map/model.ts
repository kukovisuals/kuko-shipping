import { MAP_CONFIG } from "@/config/map";
import type { LatLng, Vec3 } from "@/domain/map/project";
import { makeRoute, routePoint, type Route } from "@/domain/map/route";
import { usState, type StateCode } from "@/domain/map/usStates";
import type { OrgRules } from "@/domain/org/settings";
import { assessDelay, type Delay } from "@/domain/ship/delay";
import { deliveredPinVisible } from "@/domain/ship/progress";
import { DELAY_STATUSES, type DelayStatus } from "@/domain/ship/status";
import { loadTrucks, type Truck } from "@/domain/ship/trucks";
import type { ShipmentEvent, ShipmentTiming } from "@/domain/ship/types";
import type { Ms } from "@/domain/time";

export type MapShipment = {
  id: string;
  orderNumber: string;
  origin: string; // warehouse id
  state: StateCode;
  city: string;
  carrier: string;
  dest: LatLng;
  timing: ShipmentTiming;
  events: ShipmentEvent[];
};

export type MapOrder = MapShipment & { delay: Delay; shippedAt: Ms | null; deliveredAt: Ms | null };

export type MapTruck = Truck<MapOrder> & {
  /** Still loading at the warehouse: parked in the yard. */
  loading: boolean;
  position: Vec3;
  heading: number;
};

export type MapModel = {
  trucks: MapTruck[];
  /** Trucks not drawn because of the draw cap. */
  hiddenCount: number;
  /** One road per state with a truck on it. */
  roads: Route[];
  /** One post per state with open orders or a delivery in the last 7 days. */
  pins: (LatLng & { state: StateCode; count: number })[];
  /** Orders by status: open ones plus deliveries in the last 7 days. */
  counts: Record<DelayStatus, number>;
  /** The loading dock: its ground box and how much waits there. */
  yard: { west: number; east: number; south: number; north: number; trucks: number; orders: number };
};

export type MapOrigin = LatLng & { id: string };

/** Dock slot `i`: rows of `columns` off the warehouse, every truck facing west, toward land. */
function yardSlot(origin: LatLng, i: number): LatLng {
  const { offset, columns, spacing } = MAP_CONFIG.yard;
  return {
    lng: origin.lng + offset.lng + (i % columns) * spacing.lng,
    lat: origin.lat + offset.lat + Math.floor(i / columns) * spacing.lat,
  };
}

/** The dock pad: every slot that `count` trucks fill (at least one row), plus a margin. */
function yardBox(origin: LatLng, count: number) {
  const { columns } = MAP_CONFIG.yard;
  const first = yardSlot(origin, 0);
  const last = yardSlot(origin, Math.max(columns, Math.ceil(count / columns) * columns) - 1);
  const margin = 0.6;
  return {
    west: Math.min(first.lng, last.lng) - margin,
    east: Math.max(first.lng, last.lng) + margin,
    south: Math.min(first.lat, last.lat) - margin,
    north: Math.max(first.lat, last.lat) + margin,
  };
}

/** Everything the map draws, worked out once per `now`. */
export function buildMapModel(
  shipments: readonly MapShipment[],
  origin: MapOrigin,
  rules: OrgRules,
  now: Ms,
  maxDrawn: number = MAP_CONFIG.maxDrawn,
): MapModel {
  const orders: MapOrder[] = shipments.map((s) => ({
    ...s,
    delay: assessDelay(s.timing, rules, now),
    shippedAt: s.timing.shippedAt,
    deliveredAt: s.timing.deliveredAt,
  }));

  const counts = Object.fromEntries(DELAY_STATUSES.map((s) => [s, 0])) as Record<DelayStatus, number>;
  const pinCounts = new Map<StateCode, number>();
  for (const o of orders) {
    if (o.deliveredAt !== null && !deliveredPinVisible(o.deliveredAt, now)) continue;
    counts[o.delay.status]++;
    pinCounts.set(o.state, (pinCounts.get(o.state) ?? 0) + 1);
  }

  const routes = new Map<StateCode, Route>();
  const routeTo = (state: StateCode) => {
    let r = routes.get(state);
    if (!r) routes.set(state, (r = makeRoute(origin, usState(state))));
    return r;
  };

  let parked = 0;
  const all = loadTrucks(orders, now).map((t): MapTruck => {
    if (t.shipDay === null) {
      const slot = yardSlot(origin, parked++);
      return { ...t, loading: true, position: { x: slot.lng, y: 0, z: -slot.lat }, heading: Math.PI };
    }
    const route = routeTo(t.state);
    return { ...t, loading: false, position: routePoint(route, t.progress), heading: route.heading };
  });

  const trucks = all.length > maxDrawn ? all.filter((t) => t.status === "late" || t.status === "at_risk").slice(0, maxDrawn) : all;
  const onRoad = new Set(trucks.filter((t) => !t.loading).map((t) => t.state));
  const loading = all.filter((t) => t.loading);

  return {
    trucks,
    hiddenCount: all.length - trucks.length,
    roads: [...onRoad].map((s) => routeTo(s)),
    pins: [...pinCounts].map(([state, count]) => ({ state, count, lat: usState(state).lat, lng: usState(state).lng })),
    counts,
    yard: { ...yardBox(origin, loading.length), trucks: loading.length, orders: loading.reduce((n, t) => n + t.open, 0) },
  };
}
