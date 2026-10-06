import type { LatLng } from "@/domain/map/project";
import type { ShipmentStatus } from "@/domain/ship/status";
import type { ShipmentEvent } from "@/domain/ship/types";
import type { Ms } from "@/domain/time";

// Carriers send events out of order: everything here goes by `at`, never by arrival.

/** Oldest first. Events with the same `at` keep their arrival order. */
export function sortEvents(events: readonly ShipmentEvent[]): ShipmentEvent[] {
  return [...events].sort((a, b) => a.at - b.at);
}

export function latestEvent(events: readonly ShipmentEvent[]): ShipmentEvent | null {
  const sorted = sortEvents(events);
  return sorted.at(-1) ?? null;
}

export type EventSummary = {
  status: ShipmentStatus | null;
  lastEventAt: Ms | null;
  deliveredAt: Ms | null;
  carrierEtaAt: Ms | null;
  /** Set only when the latest event has lat/lng; otherwise the drone position is an estimate. */
  position: LatLng | null;
};

/** What add_event() keeps on the shipment row, worked out from the whole timeline. */
export function summarizeEvents(events: readonly ShipmentEvent[]): EventSummary {
  const sorted = sortEvents(events);
  const latest = sorted.at(-1) ?? null;
  const withEta = sorted.findLast((e) => e.etaAt !== null);
  const delivered = sorted.find((e) => e.status === "delivered");
  return {
    status: latest?.status ?? null,
    lastEventAt: latest?.at ?? null,
    deliveredAt: delivered?.at ?? null, // the first delivery scan counts
    carrierEtaAt: withEta?.etaAt ?? null,
    position: latest && latest.lat !== null && latest.lng !== null ? { lat: latest.lat, lng: latest.lng } : null,
  };
}
