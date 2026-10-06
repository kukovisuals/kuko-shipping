// Fixture data for the static map, built relative to `now` so the stories stay true. About 300
// orders a day over the last two weeks, all to the lower 48. The seeded database replaces this in
// M3 (same rules, §3a). All of it is simulated.
import { makeRoute, routePoint } from "@/domain/map/route";
import { US_STATES, usState, type StateCode } from "@/domain/map/usStates";
import { seededRandom, type Random } from "@/domain/random";
import { summarizeEvents } from "@/domain/ship/events";
import type { ShipmentStatus } from "@/domain/ship/status";
import { shipDayOf } from "@/domain/ship/trucks";
import type { ShipmentEvent } from "@/domain/ship/types";
import { stockFlag, worstFlag } from "@/domain/stock/lowStock";
import { DAY, HOUR, type Ms } from "@/domain/time";
import type { MapShipment } from "./model";

const SEED = 4242;
const HISTORY_DAYS = 14;
const ORDERS_PER_DAY = 300;
/** Trucks leave once a day at 19:00 UTC (3 pm in New York). */
const DISPATCH_HOUR_UTC = 19;

// A few W01 variants from §3a; the worst one sets the ring (Fall Seasonal GR-12OZ is out).
const W01_STOCK = [
  { sku: "DW-DARK-GR-1LB", onHand: 640, reorderPoint: 150 },
  { sku: "DW-FALL-WB-12OZ", onHand: 22, reorderPoint: 30 },
  { sku: "DW-FALL-GR-12OZ", onHand: 0, reorderPoint: 30 },
];

export const demoWarehouse = {
  id: "W01",
  name: "Upstate NY Roastery & Fulfilment",
  lat: 42.94,
  lng: -73.8,
  units: 14_200,
  flag: worstFlag(W01_STOCK.map((v) => stockFlag(v.onHand, v.reorderPoint))),
};

/** NY, FL, CA and TX take half the orders; the other half is spread by population. */
const BIG_FOUR: [StateCode, number][] = [["NY", 0.15], ["FL", 0.12], ["CA", 0.12], ["TX", 0.11]];
const OTHERS = US_STATES.filter((s) => !BIG_FOUR.some(([c]) => c === s.code));
const OTHERS_POPULATION = OTHERS.reduce((sum, s) => sum + s.population, 0);
export const STATE_SHARES: [StateCode, number][] = [
  ...BIG_FOUR,
  ...OTHERS.map((s): [StateCode, number] => [s.code, (0.5 * s.population) / OTHERS_POPULATION]),
];

const USPS = "USPS Ground Advantage";
const UPS = "UPS Ground";
const HUB_DELAYS = ["weather delay at hub", "hub backlog", "missed connection at hub"];

type Draft = {
  state: StateCode;
  subscription: boolean;
  carrier: string;
  placedAt: Ms;
  dest: { lat: number; lng: number };
  events: ShipmentEvent[];
};

function event(status: ShipmentStatus, at: Ms, over: Partial<ShipmentEvent> = {}): ShipmentEvent {
  return { at, status, lat: null, lng: null, place: null, note: null, etaAt: null, ...over };
}

const dispatchOn = (day: Ms) => day + DISPATCH_HOUR_UTC * HOUR;

/** Days on the road from the warehouse to a state's anchor: 1 next door, about 3 coast to coast. */
function transitDays(state: StateCode): number {
  return 1 + makeRoute(demoWarehouse, usState(state)).length / 20;
}

function draftOrder(r: Random, state: StateCode, placedAt: Ms): Omit<Draft, "events"> {
  const s = usState(state);
  return {
    state,
    subscription: r.chance(0.35),
    carrier: r.chance(0.55) ? USPS : UPS,
    placedAt,
    dest: { lat: s.lat + r.range(-0.3, 0.3), lng: s.lng + r.range(-0.3, 0.3) },
  };
}

/** The carrier events up to `now` for one order. `delay` adds days on the road after a last scan. */
function carrierEvents(
  r: Random,
  d: Omit<Draft, "events">,
  shippedAt: Ms,
  now: Ms,
  delay: { days: number; note: string } | null,
): ShipmentEvent[] {
  const planned = shippedAt + (transitDays(d.state) + r.range(0, 0.5)) * DAY;
  const deliverAt = planned + (delay?.days ?? 0) * DAY;
  const eta = delay ? (r.chance(0.3) ? deliverAt : null) : r.chance(0.7) ? planned : null;
  const route = makeRoute(demoWarehouse, d.dest);
  const hubAt = shippedAt + (planned - shippedAt) * (delay ? 0.25 : 0.5);
  const hub = routePoint(route, delay ? 0.25 : 0.5);
  const scanned = r.chance(0.5);

  const all = [
    event("in_transit", shippedAt, { place: "Upstate NY Roastery", etaAt: eta }),
    event("in_transit", hubAt, {
      lat: scanned ? -hub.z : null,
      lng: scanned ? hub.x : null,
      place: scanned ? "Carrier hub" : null,
      note: delay?.note ?? null,
      etaAt: eta,
    }),
    event("out_for_delivery", deliverAt - 6 * HOUR),
    event("delivered", deliverAt),
  ];
  return all.filter((e) => e.at <= now);
}

function generated(r: Random, now: Ms): Draft[] {
  const today = shipDayOf(now);
  const drafts: (Omit<Draft, "events"> & { shippedAt: Ms })[] = [];
  for (let k = HISTORY_DAYS - 1; k >= 0; k--) {
    const day = today - k * DAY;
    const date = new Date(day);
    const busy = (date.getUTCDay() === 1 ? 1.15 : 1) * (date.getUTCDate() === 1 ? 1.2 : 1);
    const count = Math.round(ORDERS_PER_DAY * busy * r.range(0.9, 1.1));
    for (let i = 0; i < count; i++) {
      const placedAt = day + r.next() * DAY;
      // Every generated order leaves on the next day's truck; the one slow order is story 4.
      const order = { ...draftOrder(r, r.pick(STATE_SHARES), placedAt), shippedAt: dispatchOn(day + DAY) };
      if (placedAt <= now) drafts.push(order);
    }
  }

  // One truck per state per ship day; a few trucks get held at a hub, and a rare single parcel stalls.
  const truckDelay = new Map<string, { days: number; note: string } | null>();
  return drafts.map(({ shippedAt, ...d }) => {
    const events = [event("label_created", Math.min(now, d.placedAt + HOUR))];
    if (shippedAt <= now) {
      const key = `${d.state}:${shippedAt}`;
      if (!truckDelay.has(key)) {
        truckDelay.set(key, r.chance(0.05) ? { days: r.range(3, 6), note: r.pick(HUB_DELAYS.map((n) => [n, 1] as const)) } : null);
      }
      const delay = truckDelay.get(key) ?? (r.chance(0.002) ? { days: r.range(3, 5), note: "no scan since hub" } : null);
      events.push(...carrierEvents(r, d, shippedAt, now, delay));
    }
    return { ...d, events };
  });
}

/** The §3a delay stories, moved onto US routes. */
function stories(now: Ms): Draft[] {
  const today = shipDayOf(now);
  const base = (state: StateCode, placedAt: Ms, carrier = USPS) => ({
    state,
    subscription: false,
    carrier,
    placedAt,
    dest: { lat: usState(state).lat, lng: usState(state).lng },
  });
  const label = (placedAt: Ms) => event("label_created", placedAt + HOUR);
  const left = (day: number) => event("in_transit", dispatchOn(today - day * DAY), { place: "Upstate NY Roastery" });

  const denverPlaced = now - 10 * DAY + 2 * HOUR; // promise passed 3 days ago, give or take 2 h
  return [
    // 1. Texas: carrier exception at the Dallas hub → at_risk
    {
      ...base("TX", now - 3 * DAY),
      events: [
        label(now - 3 * DAY),
        left(2),
        event("exception", now - 20 * HOUR, { lat: 32.9, lng: -97.04, place: "Dallas hub", note: "damaged label, held at hub" }),
      ],
    },
    // 2. Four UPS shipments to Denver, 3 days late
    ...[0, 1, 2, 3].map((i) => ({
      ...base("CO", denverPlaced - i * 20 * 60_000, UPS),
      events: [
        label(denverPlaced),
        left(9),
        event("in_transit", dispatchOn(today - 8 * DAY), { place: "Denver hub", lat: 39.77, lng: -104.87, note: "weather delay at hub" }),
      ],
    })),
    // 3. Chicago, no scan for 52 h → at_risk
    { ...base("IL", now - 4 * DAY), events: [label(now - 4 * DAY), left(3), event("in_transit", now - 52 * HOUR)] },
    // 4. Nashville, placed 3 days ago and not shipped (waiting on Fall Seasonal Blend GR-12OZ) → at_risk
    { ...base("TN", now - 3 * DAY), events: [label(now - 3 * DAY)] },
    // 5. Two delivered-late orders to Seattle (1 and 2 days late)
    ...[8.5, 9.5].map((ago) => ({
      ...base("WA", now - ago * DAY, UPS),
      events: [label(now - ago * DAY), left(Math.ceil(ago) - 1), event("delivered", now - DAY)],
    })),
  ];
}

const CITY = (state: StateCode) => `${usState(state).city}, ${state}`;

export function demoShipments(now: Ms): MapShipment[] {
  const r = seededRandom(SEED);
  const drafts = [...generated(r, now), ...stories(now)].sort((a, b) => a.placedAt - b.placedAt);
  return drafts.map((d, i) => {
    const n = 100_001 + i;
    const summary = summarizeEvents(d.events);
    const shipped = d.events.find((e) => e.status !== "label_created");
    return {
      id: `fx-${n}`,
      orderNumber: d.subscription ? `DW-SUB-${n}` : `DW-${n}`,
      origin: demoWarehouse.id,
      state: d.state,
      city: CITY(d.state),
      carrier: d.carrier,
      dest: d.dest,
      timing: {
        status: summary.status ?? "label_created",
        placedAt: d.placedAt,
        promisedAt: null,
        shippedAt: shipped?.at ?? null,
        deliveredAt: summary.deliveredAt,
        lastEventAt: summary.lastEventAt,
        carrierEtaAt: summary.deliveredAt === null ? summary.carrierEtaAt : null,
      },
      events: d.events,
    };
  });
}
