import { useState } from "react";
import { REGIONS, REGION_NAME, type Region } from "@/domain/map/regions";
import { usState } from "@/domain/map/usStates";
import { OPEN_STATUSES, type RegionSummary } from "@/domain/ship/regions";
import { STATUS_TOKEN } from "@/engine/colors";
import { cssVar, type Look } from "@/ui/theme";
import { regionCountsText, truckDelayShort, truckLeg } from "./loadText";
import { LookToggle } from "./LookToggle";
import type { MapTruck } from "./model";

/** Problem trucks listed under an open region; the rest are counted. */
const MAX_ROWS = 8;

const pct = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate * 100)}%`);

/** On-time rate per region. Opening a region draws its trucks on the map and lists its late and
 * at-risk ones; picking one opens its truck card. "Hide" folds it into a small button so the map is clear. */
export function RegionPanel({
  regions,
  open,
  onToggle,
  onPick,
  look,
  onLook,
}: {
  regions: Record<Region, RegionSummary<MapTruck>>;
  open: Region | null;
  onToggle: (region: Region) => void;
  onPick: (truck: MapTruck) => void;
  look: Look;
  onLook: (look: Look) => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        aria-expanded={false}
        aria-controls="region-panel"
        className="ui-pill ui-label pointer-events-auto absolute right-3 bottom-12 px-3 py-2 hover:text-ink sm:top-3 sm:bottom-auto"
      >
        On-time rate ▸
      </button>
    );
  }
  return (
    <aside
      id="region-panel"
      aria-label="Regions"
      className="ui-card pointer-events-auto absolute right-3 bottom-3 left-3 max-h-[32dvh] overflow-y-auto sm:top-3 sm:max-h-[calc(100dvh-1.5rem)] sm:bottom-auto sm:left-auto sm:w-80"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <p className="ui-label">On-time rate · click to open</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <LookToggle look={look} onLook={onLook} />
          <button
            type="button"
            onClick={() => setHidden(true)}
            aria-expanded
            aria-controls="region-panel"
            aria-label="Hide on-time rate"
            title="Hide"
            className="ui-label ui-hover rounded-md px-1.5 py-1 hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>
      <ul className="mt-2 pb-2">
        {REGIONS.map((r) => {
          const s = regions[r];
          const isOpen = open === r;
          return (
            <li key={r} className={`mx-2 border-t border-line first:border-t-0 ${isOpen ? "ui-selected rounded-xl border-transparent" : ""}`}>
              <button
                type="button"
                onClick={() => onToggle(r)}
                aria-expanded={isOpen}
                className="ui-hover block w-full rounded-xl px-2 py-3 text-left"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className={`font-semibold ${isOpen ? "text-accent" : "text-ink"}`}>{REGION_NAME[r]}</span>
                  <span className="font-medium text-ink tabular-nums">{pct(s.onTimeRate)}</span>
                </span>
                <span aria-hidden className="mt-2.5 flex h-1.5 gap-1 overflow-hidden rounded-full">
                  {s.open > 0 &&
                    OPEN_STATUSES.map((k) =>
                      s.orders[k] > 0 ? (
                        <span key={k} className="rounded-full" style={{ flexGrow: s.orders[k], background: cssVar(STATUS_TOKEN[k]) }} />
                      ) : null,
                    )}
                </span>
                <span className="mt-2 block text-sm text-muted">
                  {regionCountsText(s.orders)} · {s.trucks} {s.trucks === 1 ? "truck" : "trucks"}
                </span>
              </button>
              {isOpen && <Problems trucks={s.problems} onPick={onPick} />}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Problems({ trucks, onPick }: { trucks: MapTruck[]; onPick: (truck: MapTruck) => void }) {
  if (trucks.length === 0) return <p className="px-2 pb-3 text-sm" style={{ color: cssVar("statusOnTime") }}>All trucks on time</p>;
  return (
    <ul className="pb-2">
      {trucks.slice(0, MAX_ROWS).map((t) => (
        <li key={t.key}>
          <button type="button" onClick={() => onPick(t)} className="ui-hover flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm">
            <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: cssVar(STATUS_TOKEN[t.status]) }} />
            <span className="shrink-0 whitespace-nowrap text-ink">{usState(t.state).city}</span>
            <span className="truncate font-mono text-xs text-muted">{truckLeg(t)}</span>
            <span className="ml-auto shrink-0 pl-2 font-mono text-xs tabular-nums" style={{ color: cssVar(STATUS_TOKEN[t.status]) }}>
              {truckDelayShort(t)}
            </span>
          </button>
        </li>
      ))}
      {trucks.length > MAX_ROWS && <li className="px-2 pt-1 text-xs text-muted">+{trucks.length - MAX_ROWS} more on the map</li>}
    </ul>
  );
}
