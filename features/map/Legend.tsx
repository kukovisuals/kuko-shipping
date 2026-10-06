import { BRAND } from "@/domain/brand";
import { DELAY_STATUSES, DELAY_STATUS_LABEL, type DelayStatus } from "@/domain/ship/status";
import { STATUS_TOKEN } from "@/engine/colors";
import { THEME } from "@/ui/theme";

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
    <section aria-label="Legend" className="ui-card pointer-events-auto absolute top-3 left-3 max-w-[calc(100%-1.5rem)] p-3">
      <h1 className="font-pixel text-sm text-accent">{BRAND.product}</h1>
      <p className="ui-label mt-0.5">{BRAND.demoClient} · demo</p>
      <p className="mt-3 text-sm text-ink">
        <span className="tabular-nums">{onRoad}</span> trucks on the road · <span className="tabular-nums">{loading}</span> loading
      </p>
      <p className="ui-label mt-3">Orders · truck colour = its worst order</p>
      <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-1">
        {DELAY_STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span aria-hidden className="inline-block size-2.5" style={{ background: THEME[STATUS_TOKEN[s]] }} />
            <span className="text-ink">{DELAY_STATUS_LABEL[s]}</span>
            <span className="ml-auto pl-2 text-muted tabular-nums">{counts[s]}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && <p className="mt-2 text-xs text-muted">+{hiddenCount} on-time trucks not drawn</p>}
      <p className="mt-2 text-xs text-muted">Truck positions are estimates.</p>
    </section>
  );
}
