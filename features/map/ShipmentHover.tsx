import { DELAY_STATUS_LABEL, SHIPMENT_STATUS_LABEL } from "@/domain/ship/status";
import { describeDuration } from "@/domain/time";
import { STATUS_TOKEN } from "@/engine/colors";
import { THEME } from "@/ui/theme";
import type { MapItem } from "./model";

/** Quick read-out for the hovered (or tapped) drone. The full shipment card comes in M6. */
export function ShipmentHover({ item }: { item: MapItem }) {
  const { delay } = item;
  const lastNote = item.events.at(-1)?.note;
  return (
    <aside
      aria-live="polite"
      className="ui-card pointer-events-none absolute bottom-14 left-3 w-[min(20rem,calc(100%-1.5rem))] p-3 text-sm"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-pixel text-ink">{item.orderNumber}</span>
        <span className="font-pixel text-xs" style={{ color: THEME[STATUS_TOKEN[delay.status]] }}>
          {DELAY_STATUS_LABEL[delay.status]}
          {delay.daysLate > 0 && ` · ${delay.daysLate} d`}
        </span>
      </div>
      <p className="mt-1 text-muted">
        {item.city} · {item.carrier}
      </p>
      <p className="mt-2 text-ink">
        {SHIPMENT_STATUS_LABEL[item.timing.status]} — {delay.reason}
        {lastNote && <span className="text-muted"> ({lastNote})</span>}
      </p>
      <p className="mt-1 text-muted">
        {delay.remainingMs === null ? "No carrier ETA" : `Carrier ETA in ${describeDuration(delay.remainingMs)}`}
      </p>
      {item.position.estimated && <p className="ui-label mt-2">Estimated position</p>}
    </aside>
  );
}
