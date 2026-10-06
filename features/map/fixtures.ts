// Fixture data for the static map (M2), built relative to `now` so the stories stay true.
// The seeded database replaces this in M3. All of it is simulated.
import type { LatLng } from "@/domain/map/project";
import type { ShipmentStatus } from "@/domain/ship/status";
import type { ShipmentEvent } from "@/domain/ship/types";
import { stockFlag, worstFlag } from "@/domain/stock/lowStock";
import { DAY, HOUR, type Ms } from "@/domain/time";
import type { MapShipment } from "./model";

const CITIES = {
  "New York, NY": { lat: 40.71, lng: -74.01 },
  "Los Angeles, CA": { lat: 34.05, lng: -118.24 },
  "Chicago, IL": { lat: 41.88, lng: -87.63 },
  "Boston, MA": { lat: 42.36, lng: -71.06 },
  "Denver, CO": { lat: 39.74, lng: -104.99 },
  "Houston, TX": { lat: 29.76, lng: -95.37 },
  "Seattle, WA": { lat: 47.61, lng: -122.33 },
  "Atlanta, GA": { lat: 33.75, lng: -84.39 },
  "Phoenix, AZ": { lat: 33.45, lng: -112.07 },
  "Miami, FL": { lat: 25.76, lng: -80.19 },
  "Nashville, TN": { lat: 36.16, lng: -86.78 },
  "Portland, OR": { lat: 45.52, lng: -122.68 },
  "Austin, TX": { lat: 30.27, lng: -97.74 },
  "Toronto, ON": { lat: 43.65, lng: -79.38 },
  "Vancouver, BC": { lat: 49.28, lng: -123.12 },
  London: { lat: 51.51, lng: -0.13 },
  "Sydney, NSW": { lat: -33.87, lng: 151.21 },
} satisfies Record<string, LatLng>;

type City = keyof typeof CITIES;

type Story = {
  n: number;
  city: City;
  offset?: [number, number];
  carrier: string;
  placed: number; // days ago
  shipped?: number; // days ago; omitted = not shipped
  lastScan?: number; // hours ago
  status: ShipmentStatus;
  promiseDays?: number; // the order's own promise (international)
  delivered?: number; // days ago
  etaIn?: number; // hours from now
  scan?: LatLng & { place: string };
  note?: string;
};

const USPS = "USPS Ground Advantage";
const UPS = "UPS Ground";
const FEDEX = "FedEx International";

const STORIES: Story[] = [
  // 1. Sydney held at customs → at_risk (and the date-line arc)
  { n: 100412, city: "Sydney, NSW", carrier: FEDEX, placed: 9, shipped: 8, lastScan: 20, status: "exception", promiseDays: 14, scan: { lat: -33.95, lng: 151.18, place: "Sydney customs" }, note: "held at customs" },
  // 2. Four UPS shipments to Denver, 3 days late
  ...([[0, 0], [0.2, -0.15], [-0.18, 0.12], [0.1, 0.25]] as [number, number][]).map((offset, i): Story => ({
    n: 100380 + i, city: "Denver, CO", offset, carrier: UPS, placed: 10, shipped: 9, lastScan: 18, status: "in_transit", note: "weather delay at hub",
  })),
  // 3. Chicago, no scan for 52 h → at_risk
  { n: 100455, city: "Chicago, IL", carrier: USPS, placed: 4, shipped: 3, lastScan: 52, status: "in_transit" },
  // 4. Placed 3 days ago, not shipped (waiting on Fall Seasonal Blend GR-12OZ) → at_risk
  { n: 100470, city: "Nashville, TN", carrier: USPS, placed: 3, status: "label_created" },
  // 5. Two delivered-late orders to London
  { n: 100301, city: "London", carrier: FEDEX, placed: 16, shipped: 15, status: "delivered", promiseDays: 14, delivered: 1 },
  { n: 100296, city: "London", offset: [0.15, 0.2], carrier: FEDEX, placed: 17, shipped: 16, status: "delivered", promiseDays: 14, delivered: 1 },
  // Late by a day, and one inside the risk window
  { n: 100421, city: "Miami, FL", carrier: UPS, placed: 8, shipped: 6, lastScan: 10, status: "in_transit" },
  { n: 100433, city: "Phoenix, AZ", carrier: UPS, placed: 6.7, shipped: 5, lastScan: 6, status: "in_transit", etaIn: 5 },
  // On time
  { n: 100488, city: "New York, NY", carrier: USPS, placed: 2, shipped: 1, lastScan: 6, status: "in_transit", etaIn: 20 },
  { n: 100479, city: "New York, NY", offset: [0.2, 0.18], carrier: USPS, placed: 3, shipped: 2, lastScan: 10, status: "in_transit", etaIn: 8 },
  { n: 100495, city: "New York, NY", offset: [-0.15, 0.1], carrier: UPS, placed: 1, shipped: 0.5, lastScan: 3, status: "in_transit" },
  { n: 100476, city: "Los Angeles, CA", carrier: UPS, placed: 3, shipped: 2, lastScan: 8, status: "in_transit", etaIn: 30 },
  { n: 100462, city: "Seattle, WA", carrier: UPS, placed: 4, shipped: 3, lastScan: 12, status: "in_transit" },
  { n: 100458, city: "Boston, MA", carrier: USPS, placed: 5, shipped: 4, lastScan: 5, status: "out_for_delivery", etaIn: 4 },
  { n: 100490, city: "Atlanta, GA", carrier: USPS, placed: 2, shipped: 1, lastScan: 4, status: "in_transit", etaIn: 40 },
  { n: 100467, city: "Toronto, ON", carrier: FEDEX, placed: 5, shipped: 4, lastScan: 14, status: "in_transit", promiseDays: 14 },
  { n: 100485, city: "Austin, TX", carrier: UPS, placed: 2, shipped: 1, lastScan: 20, status: "in_transit", scan: { lat: 32.9, lng: -97.04, place: "Dallas hub" } },
  { n: 100499, city: "Portland, OR", carrier: UPS, placed: 1, status: "label_created" },
  { n: 100463, city: "Vancouver, BC", carrier: FEDEX, placed: 6, shipped: 5, lastScan: 30, status: "in_transit", promiseDays: 14 },
  { n: 100441, city: "Houston, TX", carrier: UPS, placed: 6, shipped: 5, status: "delivered", delivered: 2 },
];

function event(status: ShipmentStatus, at: Ms, over: Partial<ShipmentEvent> = {}): ShipmentEvent {
  return { at, status, lat: null, lng: null, place: null, note: null, etaAt: null, ...over };
}

function build(s: Story, now: Ms): MapShipment {
  const base = CITIES[s.city];
  const [dLat, dLng] = s.offset ?? [0, 0];
  const placedAt = now - s.placed * DAY;
  const shippedAt = s.shipped === undefined ? null : now - s.shipped * DAY;
  const deliveredAt = s.delivered === undefined ? null : now - s.delivered * DAY;
  const carrierEtaAt = s.etaIn === undefined ? null : now + s.etaIn * HOUR;
  const lastScanAt = s.lastScan === undefined ? null : now - s.lastScan * HOUR;

  const events: ShipmentEvent[] = [event("label_created", placedAt + HOUR)];
  if (shippedAt !== null) events.push(event("in_transit", shippedAt));
  if (lastScanAt !== null && lastScanAt !== shippedAt) {
    events.push(
      event(s.status, lastScanAt, {
        lat: s.scan?.lat ?? null,
        lng: s.scan?.lng ?? null,
        place: s.scan?.place ?? null,
        note: s.note ?? null,
        etaAt: carrierEtaAt,
      }),
    );
  }
  if (deliveredAt !== null) events.push(event("delivered", deliveredAt));

  return {
    id: `fx-${s.n}`,
    orderNumber: `DW-${s.n}`,
    city: s.city,
    carrier: s.carrier,
    dest: { lat: base.lat + dLat, lng: base.lng + dLng },
    timing: {
      status: s.status,
      placedAt,
      promisedAt: s.promiseDays === undefined ? null : placedAt + s.promiseDays * DAY,
      shippedAt,
      deliveredAt,
      lastEventAt: events.at(-1)?.at ?? null,
      carrierEtaAt,
    },
    events,
  };
}

export function demoShipments(now: Ms): MapShipment[] {
  return STORIES.map((s) => build(s, now));
}

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
