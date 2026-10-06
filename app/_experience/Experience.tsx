"use client";

import { useMemo, useState } from "react";
import { LOOK_COOKIE } from "@/config/map";
import { US_BOUNDS } from "@/domain/map/usStates";
import { DEFAULT_RULES } from "@/domain/org/settings";
import type { Ms } from "@/domain/time";
import { MapScene, demoShipments, demoWarehouse, type MapLand } from "@/features/map";
import type { Look } from "@/ui/theme";
import us from "@/public/map/us.json";

const LAND: MapLand = {
  bounds: US_BOUNDS,
  outlines: us.outlines as [number, number][][],
};

/** Wires the features together. The map draws fixture data until M3 swaps in the seeded database. */
export function Experience({ now, initialLook }: { now: Ms; initialLook: Look }) {
  const shipments = useMemo(() => demoShipments(now), [now]);
  const [look, setLook] = useState(initialLook);
  // The look lives on <html> (so every CSS token follows) and in a cookie (so the server renders it next time).
  const changeLook = (next: Look) => {
    setLook(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${LOOK_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <main className="fixed inset-0">
      <MapScene shipments={shipments} rules={DEFAULT_RULES} now={now} land={LAND} warehouse={demoWarehouse} look={look} onLook={changeLook} />
    </main>
  );
}
