"use client";

import { useMemo } from "react";
import { landCells, type LandGrid } from "@/domain/map/land";
import { DEFAULT_RULES } from "@/domain/org/settings";
import type { Ms } from "@/domain/time";
import { MapScene, buildMapModel, demoShipments, demoWarehouse } from "@/features/map";
import landGrid from "@/public/map/land.json";

const LAND = landCells(landGrid as LandGrid);

/** Wires the features together. M2 draws fixture data; M3 swaps in the seeded database. */
export function Experience({ now }: { now: Ms }) {
  const model = useMemo(() => buildMapModel(demoShipments(now), demoWarehouse, DEFAULT_RULES, now), [now]);
  return (
    <main className="fixed inset-0">
      <MapScene model={model} land={LAND} warehouse={demoWarehouse} />
    </main>
  );
}
