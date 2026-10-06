import type { ShipmentStatus } from "@/domain/ship/status";
import type { Ms } from "@/domain/time";

/** One carrier scan or hand-entered update. lat/lng are both set or both null. */
export type ShipmentEvent = {
  at: Ms;
  status: ShipmentStatus;
  lat: number | null;
  lng: number | null;
  place: string | null;
  note: string | null;
  etaAt: Ms | null;
};

/** The times the delay and progress rules need, from the order and its shipment. */
export type ShipmentTiming = {
  status: ShipmentStatus;
  placedAt: Ms;
  promisedAt: Ms | null; // the order's own promise; null = use the company SLA
  shippedAt: Ms | null;
  deliveredAt: Ms | null;
  lastEventAt: Ms | null;
  carrierEtaAt: Ms | null;
};
