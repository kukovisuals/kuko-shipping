import { MAP_CONFIG } from "@/config/map";
import { makeArc, type Arc } from "@/domain/map/arc";
import { mergePins, type Pin } from "@/domain/map/pins";
import type { LatLng } from "@/domain/map/project";
import type { OrgRules } from "@/domain/org/settings";
import { assessDelay, type Delay } from "@/domain/ship/delay";
import { summarizeEvents } from "@/domain/ship/events";
import { deliveredPinVisible, dronePosition, progressAt, type DronePosition } from "@/domain/ship/progress";
import { DELAY_STATUSES, type DelayStatus } from "@/domain/ship/status";
import type { ShipmentEvent, ShipmentTiming } from "@/domain/ship/types";
import type { Ms } from "@/domain/time";

export type MapShipment = {
  id: string;
  orderNumber: string;
  city: string;
  carrier: string;
  dest: LatLng;
  timing: ShipmentTiming;
  events: ShipmentEvent[];
};

export type MapItem = MapShipment & { delay: Delay; arc: Arc; position: DronePosition; delivered: boolean };

export type MapModel = {
  /** Open shipments to draw as drones and routes. */
  drones: MapItem[];
  /** Open shipments not drawn because of the draw cap. */
  hiddenCount: number;
  pins: Pin<LatLng & { id: string }>[];
  counts: Record<DelayStatus, number>;
};

/** Everything the map draws, worked out once per `now`. */
export function buildMapModel(
  shipments: readonly MapShipment[],
  origin: LatLng,
  rules: OrgRules,
  now: Ms,
  maxDrawn: number = MAP_CONFIG.maxDrawn,
): MapModel {
  const items: MapItem[] = shipments.map((s) => {
    const delay = assessDelay(s.timing, rules, now);
    const arc = makeArc(origin, s.dest);
    const delivered = s.timing.deliveredAt !== null;
    const scan = !delivered && s.timing.shippedAt !== null ? summarizeEvents(s.events).position : null;
    const progress = progressAt({ ...s.timing, promisedAt: delay.promisedAt }, now);
    return { ...s, delay, arc, delivered, position: dronePosition(arc, progress, scan) };
  });

  const counts = Object.fromEntries(DELAY_STATUSES.map((s) => [s, 0])) as Record<DelayStatus, number>;
  for (const item of items) counts[item.delay.status]++;

  const open = items.filter((i) => !i.delivered);
  const drones =
    open.length > maxDrawn
      ? open.filter((i) => i.delay.status === "late" || i.delay.status === "at_risk").slice(0, maxDrawn)
      : open;

  const pinned = items.filter((i) => !i.delivered || deliveredPinVisible(i.timing.deliveredAt ?? now, now));
  return {
    drones,
    hiddenCount: open.length - drones.length,
    pins: mergePins(pinned.map((i) => ({ id: i.id, ...i.dest }))),
    counts,
  };
}
