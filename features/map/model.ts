import { MAP_CONFIG } from "@/config/map";
import type { LatLng, Vec3 } from "@/domain/map/project";
import { REGIONS, regionOf, type Region } from "@/domain/map/regions";
import { makeRoute, routeHeading, routePoint, type Route } from "@/domain/map/route";
import { usState, type StateCode } from "@/domain/map/usStates";
import type { OrgRules } from "@/domain/org/settings";
import { assessDelay, type Delay } from "@/domain/ship/delay";
import { deliveredPinVisible } from "@/domain/ship/progress";
import { timingAsOf } from "@/domain/ship/replay";
import { summarizeRegions, type RegionSummary } from "@/domain/ship/regions";
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
  region: Region;
  /** Still loading at the warehouse: parked in the yard. */
  loading: boolean;
  position: Vec3;
  heading: number;
};

export type MapYard = { west: number; east: number; south: number; north: number; trucks: number; orders: number };

export type MapModel = {
  trucks: MapTruck[];
  /** Trucks not drawn because of the draw cap. */
  hiddenCount: number;
  /** One road per state with a truck on it. */
  roads: (Route & { state: StateCode; region: Region })[];
  /** One post per state with open orders or a delivery in the last 7 days. */
  pins: (LatLng & { state: StateCode; region: Region; count: number })[];
  /** Orders by status: open ones plus deliveries in the last 7 days. */
  counts: Record<DelayStatus, number>;
  /** Each region's open orders and problem trucks (from every truck, drawn or not). */
  regions: Record<Region, RegionSummary<MapTruck>>;
  /** The loading dock per region: the map shows one region's trucks at a time, so each region
   * parks its loading trucks from the first slot. */
  yards: Record<Region, MapYard>;
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

/** The shipments as they stood at `at`: unplaced orders dropped, later scans not yet seen. */
export function shipmentsAsOf(shipments: readonly MapShipment[], at: Ms): MapShipment[] {
  return shipments.flatMap((s) => {
    const timing = timingAsOf(s, at);
    return timing ? [{ ...s, timing, events: s.events.filter((e) => e.at <= at) }] : [];
  });
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

  const parked = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>;
  const all = loadTrucks(orders, now).map((t): MapTruck => {
    const region = regionOf(t.state);
    if (t.shipDay === null) {
      const slot = yardSlot(origin, parked[region]++);
      return { ...t, region, loading: true, position: { x: slot.lng, y: 0, z: -slot.lat }, heading: Math.PI };
    }
    const route = routeTo(t.state);
    return { ...t, region, loading: false, position: routePoint(route, t.progress), heading: routeHeading(route, t.progress) };
  });

  const trucks = all.length > maxDrawn ? all.filter((t) => t.status === "late" || t.status === "at_risk").slice(0, maxDrawn) : all;
  const onRoad = new Set(trucks.filter((t) => !t.loading).map((t) => t.state));
  const yards = Object.fromEntries(
    REGIONS.map((r) => {
      const loading = trucks.filter((t) => t.loading && t.region === r);
      return [r, { ...yardBox(origin, loading.length), trucks: loading.length, orders: loading.reduce((n, t) => n + t.open, 0) }];
    }),
  ) as Record<Region, MapYard>;

  return {
    trucks,
    hiddenCount: all.length - trucks.length,
    roads: [...onRoad].map((state) => ({ ...routeTo(state), state, region: regionOf(state) })),
    pins: [...pinCounts].map(([state, count]) => ({ state, region: regionOf(state), count, lat: usState(state).lat, lng: usState(state).lng })),
    counts,
    regions: summarizeRegions(all),
    yards,
  };
}
