"use client";

import { useMemo } from "react";
import { landCells, type LandGrid } from "@/domain/map/land";
import { US_BOUNDS } from "@/domain/map/usStates";
import { DEFAULT_RULES } from "@/domain/org/settings";
import type { Ms } from "@/domain/time";
import { MapScene, buildMapModel, demoShipments, demoWarehouse, type MapLand } from "@/features/map";
import us from "@/public/map/us.json";

const GRID = us.grid as LandGrid;
const LAND: MapLand = {
  cells: landCells(GRID),
  cellDeg: GRID.cellDeg,
  bounds: US_BOUNDS,
  outlines: us.outlines as [number, number][][],
};

/** Wires the features together. The map draws fixture data until M3 swaps in the seeded database. */
export function Experience({ now }: { now: Ms }) {
  const model = useMemo(() => buildMapModel(demoShipments(now), demoWarehouse, DEFAULT_RULES, now), [now]);
  return (
    <main className="fixed inset-0">
      <MapScene model={model} land={LAND} warehouse={demoWarehouse} />
    </main>
  );
}
