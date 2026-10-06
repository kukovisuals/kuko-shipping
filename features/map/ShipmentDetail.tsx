import { COMPANY_TIME_ZONE } from "@/config/map";
import { DELAY_STATUS_LABEL, SHIPMENT_STATUS_LABEL } from "@/domain/ship/status";
import { summarizeEvents } from "@/domain/ship/events";
import { describeDuration, localDate } from "@/domain/time";
import { STATUS_TOKEN } from "@/engine/colors";
import { THEME } from "@/ui/theme";
import type { MapOrder } from "./model";

/** One order on a truck. The full shipment card with the timeline comes in M6. */
export function ShipmentDetail({ order }: { order: MapOrder }) {
  const { delay, timing } = order;
  const lastNote = order.events.findLast((e) => e.note !== null)?.note;
  const scan = summarizeEvents(order.events).position;
  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-pixel text-ink">{order.orderNumber}</span>
        <span className="font-pixel text-xs" style={{ color: THEME[STATUS_TOKEN[delay.status]] }}>
          {DELAY_STATUS_LABEL[delay.status]}
          {delay.daysLate > 0 && ` · ${delay.daysLate} d`}
        </span>
      </div>
      <p className="mt-1 text-muted">
        {order.city} · {order.carrier}
      </p>
      <p className="mt-2 text-ink">
        {SHIPMENT_STATUS_LABEL[timing.status]} — {delay.reason}
        {lastNote && <span className="text-muted"> ({lastNote})</span>}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-muted">
        <dt>Placed</dt>
        <dd className="text-ink tabular-nums">{localDate(timing.placedAt, COMPANY_TIME_ZONE)}</dd>
        <dt>Promised</dt>
        <dd className="text-ink tabular-nums">{localDate(delay.promisedAt, COMPANY_TIME_ZONE)}</dd>
        {timing.deliveredAt === null ? (
          <>
            <dt>Arrives</dt>
            <dd className="text-ink">{delay.remainingMs === null ? "No carrier ETA" : `Carrier ETA in ${describeDuration(delay.remainingMs)}`}</dd>
          </>
        ) : (
          <>
            <dt>Delivered</dt>
            <dd className="text-ink tabular-nums">{localDate(timing.deliveredAt, COMPANY_TIME_ZONE)}</dd>
          </>
        )}
      </dl>
      {timing.deliveredAt === null && (
        <p className="ui-label mt-2">{scan ? "Last scan has a position" : "Estimated position"}</p>
      )}
    </div>
  );
}
