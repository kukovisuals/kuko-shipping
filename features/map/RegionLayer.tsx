import { useMemo } from "react";
import type { Color } from "three";
import { MAP_CONFIG } from "@/config/map";
import { project, type Vec3 } from "@/domain/map/project";
import { REGIONS, REGION_HUB, REGION_NAME } from "@/domain/map/regions";
import { routeSegments } from "@/domain/map/route";
import { usState, type StateCode } from "@/domain/map/usStates";
import { OPEN_STATUSES, type OpenStatus } from "@/domain/ship/regions";
import type { DelayStatus } from "@/domain/ship/status";
import { worstStatus } from "@/domain/ship/trucks";
import { STATUS_TOKEN } from "@/engine/colors";
import { Label } from "@/engine/Label";
import { Land } from "@/engine/Land";
import { Lines } from "@/engine/Lines";
import { usePalette } from "@/engine/palette";
import { RegionRing } from "@/engine/RegionRing";
import type { LayerProps } from "./layers";
import { compactCount, truckDelayShort } from "./loadText";

/** Worst status per state among the open region's trucks on the road. */
export function roadStatuses(drawn: LayerProps["drawn"]): Map<StateCode, OpenStatus> {
  const by = new Map<StateCode, DelayStatus[]>();
  for (const t of drawn) if (!t.loading) by.set(t.state, [...(by.get(t.state) ?? []), t.status]);
  return new Map([...by].map(([state, statuses]) => {
    const s = worstStatus(statuses);
    return [state, s === "delivered_late" ? "late" : s];
  }));
}

/** The map itself in either look: a solid land slab, state borders, the open region's roads and callouts,
 * and a ring per closed region. Colours come from the palette, so Dark and Light share this layout. */
export function RegionLayer({ model, land, region, drawn, callouts, ground, onRegion }: LayerProps) {
  const { glow } = usePalette();
  const colors = useMemo(
    () => ({
      border: glow("neon", 0.9),
      road: Object.fromEntries(OPEN_STATUSES.map((s) => [s, glow(STATUS_TOKEN[s], s === "on_time" ? 0.8 : 1.3)])) as Record<OpenStatus, Color>,
      ring: Object.fromEntries(OPEN_STATUSES.map((s) => [s, glow(STATUS_TOKEN[s], 1.5)])) as Record<OpenStatus, Color>,
    }),
    [glow],
  );

  // Each road takes the colour of the worst truck on it, like the trucks themselves.
  const roads = useMemo(() => {
    const worst = roadStatuses(drawn);
    const by = Object.fromEntries(OPEN_STATUSES.map((s) => [s, [] as [Vec3, Vec3][]])) as Record<OpenStatus, [Vec3, Vec3][]>;
    for (const r of model.roads) {
      const s = worst.get(r.state);
      if (s) by[s].push(...routeSegments(r, 24, ground + 0.01));
    }
    return by;
  }, [model, drawn, ground]);
  const borders = useMemo(
    () =>
      land.outlines.flatMap((ring) =>
        ring.slice(1).map(([lng, lat], i): [Vec3, Vec3] => [
          { x: ring[i][0], y: ground + 0.005, z: -ring[i][1] },
          { x: lng, y: ground + 0.005, z: -lat },
        ]),
      ),
    [land, ground],
  );

  const { ring } = MAP_CONFIG;
  return (
    <>
      <Land outlines={land.outlines} bounds={land.bounds} />
      <Lines segments={borders} color={colors.border} opacity={0.6} />
      {OPEN_STATUSES.map((s) => roads[s].length > 0 && <Lines key={s} segments={roads[s]} color={colors.road[s]} opacity={s === "on_time" ? 0.4 : 0.75} />)}
      {callouts.map((t) => {
        const at = usState(t.state);
        return (
          <Label
            key={`callout-${t.state}`}
            text={`${at.city} · ${truckDelayShort(t)}`}
            position={[at.lng, ground + 1.1, -at.lat]}
            size={0.6}
            color={STATUS_TOKEN[t.status]}
          />
        );
      })}
      {REGIONS.filter((r) => r !== region).map((r) => {
        const s = model.regions[r];
        const p = project(REGION_HUB[r]);
        const allOnTime = s.open > 0 && s.problems.length === 0;
        const scale = region ? ring.openScale : 1;
        return (
          <RegionRing
            key={r}
            position={[p.x, ring.height * scale, p.z]}
            radius={ring.radius * scale}
            segments={OPEN_STATUSES.map((k) => ({ share: s.open ? s.orders[k] / s.open : 0, color: colors.ring[k] }))}
            value={compactCount(s.open)}
            caption={s.open === 1 ? "open order" : "open orders"}
            title={REGION_NAME[r]}
            note={region ? undefined : allOnTime ? "All on time" : s.problems.length ? `${s.problems.length} trucks need a look` : undefined}
            noteColor={allOnTime ? "statusOnTime" : "statusAtRisk"}
            onSelect={() => onRegion(r)}
          />
        );
      })}
    </>
  );
}
