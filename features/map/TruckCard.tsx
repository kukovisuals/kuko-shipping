import { DELAY_STATUS_LABEL } from "@/domain/ship/status";
import { STATUS_TOKEN } from "@/engine/colors";
import { THEME } from "@/ui/theme";
import { truckLeg, truckSummary, truckTitle } from "./loadText";
import type { MapOrder, MapTruck } from "./model";
import { ShipmentDetail } from "./ShipmentDetail";

const CARD = "ui-card absolute bottom-14 left-3 w-[min(22rem,calc(100%-1.5rem))] p-3 text-sm";

function Header({ truck }: { truck: MapTruck }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-pixel text-ink">{truckTitle(truck)}</span>
        <span className="font-pixel text-xs" style={{ color: THEME[STATUS_TOKEN[truck.status]] }}>
          {DELAY_STATUS_LABEL[truck.status]}
        </span>
      </div>
      <p className="mt-1 text-muted">{truckLeg(truck)}</p>
      <p className="mt-1 text-ink">{truckSummary(truck)}</p>
    </>
  );
}

/** Quick read-out for the hovered truck. */
export function TruckHover({ truck }: { truck: MapTruck }) {
  return (
    <aside aria-live="polite" className={`${CARD} pointer-events-none`}>
      <Header truck={truck} />
      <p className="ui-label mt-2">Estimated position · click for orders</p>
    </aside>
  );
}

/** The picked truck: its orders, worst first; pick one to see it. */
export function TruckCard({
  truck,
  order,
  onOrder,
  onClose,
}: {
  truck: MapTruck;
  order: MapOrder | null;
  onOrder: (id: string | null) => void;
  onClose: () => void;
}) {
  return (
    <aside aria-label={truckTitle(truck)} className={`${CARD} pointer-events-auto flex max-h-[55dvh] flex-col`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Header truck={truck} />
        </div>
        <button type="button" onClick={onClose} className="ui-label px-1 hover:text-ink" aria-label="Close">
          ✕
        </button>
      </div>
      <p className="ui-label mt-2">Estimated position</p>
      {order ? (
        <div className="mt-3 border-t border-line pt-3">
          <button type="button" onClick={() => onOrder(null)} className="ui-label mb-2 hover:text-ink">
            ← All orders
          </button>
          <ShipmentDetail order={order} />
        </div>
      ) : (
        <ul className="mt-3 -mx-1 min-h-0 flex-1 overflow-y-auto border-t border-line pt-2">
          {truck.orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onOrder(o.id)}
                className="flex w-full items-baseline gap-2 px-1 py-1 text-left hover:bg-body"
              >
                <span aria-hidden className="inline-block size-2 shrink-0" style={{ background: THEME[STATUS_TOKEN[o.delay.status]] }} />
                <span className="text-ink tabular-nums">{o.orderNumber}</span>
                <span className="ml-auto truncate pl-2 text-xs text-muted">
                  {o.deliveredAt === null ? o.delay.reason : "delivered"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
