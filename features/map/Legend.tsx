import { DELAY_STATUSES, DELAY_STATUS_LABEL, type DelayStatus } from "@/domain/ship/status";
import { STATUS_TOKEN } from "@/engine/colors";
import { cssVar } from "@/ui/theme";

/** One line under the map: what each colour means and how many orders have it, then the fleet. */
export function Legend({
  counts,
  onRoad,
  loading,
  hiddenCount,
}: {
  counts: Record<DelayStatus, number>;
  onRoad: number;
  loading: number;
  hiddenCount: number;
}) {
  return (
    <section
      aria-label="Legend"
      className="ui-card pointer-events-none absolute top-3 left-3 max-w-[calc(100%-1.5rem)] px-4 py-2 text-xs sm:top-auto sm:bottom-3 sm:max-w-[calc(100%-24rem)]"
    >
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {DELAY_STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: cssVar(STATUS_TOKEN[s]) }} />
            <span className="text-ink">{DELAY_STATUS_LABEL[s]}</span>
            <span className="text-muted tabular-nums">{counts[s].toLocaleString("en-US")}</span>
          </li>
        ))}
        <li className="text-muted">
          <span className="tabular-nums">{onRoad}</span> trucks on the road · <span className="tabular-nums">{loading}</span> loading
          {hiddenCount > 0 && ` · +${hiddenCount} not drawn`}
        </li>
        <li className="text-muted">Truck colour = its worst order · positions are estimates</li>
      </ul>
    </section>
  );
}
