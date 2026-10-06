import { useState } from "react";
import { COMPANY_TIME_ZONE } from "@/config/map";
import { REGIONS, REGION_NAME, type Region } from "@/domain/map/regions";
import { usState } from "@/domain/map/usStates";
import type { NextDay } from "@/domain/ship/nextDay";
import { OPEN_STATUSES, type RegionSummary } from "@/domain/ship/regions";
import { HOUR, localDayLabel } from "@/domain/time";
import { STATUS_TOKEN } from "@/engine/colors";
import { cssVar, type Look } from "@/ui/theme";
import { regionCountsText, truckDelayShort, truckLeg } from "./loadText";
import { LookToggle } from "./LookToggle";
import type { MapTruck } from "./model";

/** Problem trucks listed under an open region; the rest are counted. */
const MAX_ROWS = 8;

const pct = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate * 100)}%`);

/** States named per region on the next-day tab; the rest are counted. */
const MAX_STATES = 3;

type Tab = "rate" | "nextDay";
const TAB_LABEL: Record<Tab, string> = { rate: "On-time", nextDay: "Next day" };

/** Two tabs per region. "On-time": opening a region draws its trucks on the map and lists its late
 * and at-risk ones; picking one opens its truck card. "Next day": how many of today's orders each
 * region gets on tomorrow's trucks. "Hide" folds it into a small button so the map is clear. */
export function RegionPanel({
  regions,
  nextDay,
  open,
  onToggle,
  onPick,
  look,
  onLook,
}: {
  regions: Record<Region, RegionSummary<MapTruck>>;
  nextDay: NextDay;
  open: Region | null;
  onToggle: (region: Region) => void;
  onPick: (truck: MapTruck) => void;
  look: Look;
  onLook: (look: Look) => void;
}) {
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<Tab>("rate");
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
        <div role="tablist" aria-label="Region view" className="ui-label flex shrink-0 rounded-lg border border-line p-0.5">
          {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2 py-0.5 ${tab === t ? "bg-accent text-surface" : "hover:text-ink"}`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
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
      {tab === "nextDay" ? (
        <NextDayList nextDay={nextDay} open={open} onToggle={onToggle} />
      ) : (
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
      )}
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

/** Tomorrow's orders per region with a share bar and the biggest states; a row opens its region. */
function NextDayList({ nextDay, open, onToggle }: { nextDay: NextDay; open: Region | null; onToggle: (region: Region) => void }) {
  // Noon UTC falls on the same date in New York, so the label names the right day.
  const day = localDayLabel(nextDay.day + 12 * HOUR, COMPANY_TIME_ZONE);
  return (
    <div className="pb-2">
      <p className="px-4 pt-3 text-sm text-muted">
        Leaving <span className="text-ink">{day}</span> ·{" "}
        <span className="font-medium text-ink tabular-nums">{nextDay.total.toLocaleString("en-US")}</span> orders placed so far today
      </p>
      <ul className="mt-1">
        {REGIONS.map((r) => {
          const n = nextDay.regions[r];
          const isOpen = open === r;
          const rest = n.states.length - MAX_STATES;
          return (
            <li key={r} className={`mx-2 border-t border-line first:border-t-0 ${isOpen ? "ui-selected rounded-xl border-transparent" : ""}`}>
              <button type="button" onClick={() => onToggle(r)} aria-expanded={isOpen} className="ui-hover block w-full rounded-xl px-2 py-3 text-left">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={`font-semibold ${isOpen ? "text-accent" : "text-ink"}`}>{REGION_NAME[r]}</span>
                  <span className="font-medium text-ink tabular-nums">
                    {n.orders.toLocaleString("en-US")}
                    <span className="ml-1.5 text-sm font-normal text-muted">{Math.round(n.share * 100)}%</span>
                  </span>
                </span>
                <span aria-hidden className="mt-2.5 flex h-1.5 overflow-hidden rounded-full" style={{ background: cssVar("line") }}>
                  <span className="rounded-full" style={{ width: `${n.share * 100}%`, background: cssVar("accent") }} />
                </span>
                <span className="mt-2 block truncate text-sm text-muted">
                  {n.states.length === 0
                    ? "No orders yet"
                    : n.states
                        .slice(0, MAX_STATES)
                        .map((s) => `${s.state} ${s.orders}`)
                        .join(" · ") + (rest > 0 ? ` · +${rest} ${rest === 1 ? "state" : "states"}` : "")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {nextDay.waiting > 0 && (
        <p className="px-4 pt-1 text-xs text-muted">
          +{nextDay.waiting.toLocaleString("en-US")} earlier {nextDay.waiting === 1 ? "order" : "orders"} still waiting to ship
        </p>
      )}
    </div>
  );
}
