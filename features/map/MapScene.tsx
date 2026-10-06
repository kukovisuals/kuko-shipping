"use client";

import { MapControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { MAP_CONFIG } from "@/config/map";
import type { LatLng } from "@/domain/map/project";
import { towerHeight } from "@/domain/map/scale";
import type { StockFlag } from "@/domain/stock/lowStock";
import { Atmosphere } from "@/engine/Atmosphere";
import { CargoDrones } from "@/engine/CargoDrones";
import { STATUS_TOKEN, glow } from "@/engine/colors";
import { Effects } from "@/engine/Effects";
import { Land } from "@/engine/Land";
import { Pins } from "@/engine/Pins";
import { RouteArcs } from "@/engine/RouteArcs";
import { usePhone } from "@/engine/useMedia";
import { Warehouse } from "@/engine/Warehouse";
import { Legend } from "./Legend";
import type { MapModel } from "./model";
import { ShipmentHover } from "./ShipmentHover";

export type MapWarehouse = LatLng & { name: string; units: number; flag: StockFlag };

const rad = (deg: number) => (deg * Math.PI) / 180;

export function MapScene({ model, land, warehouse }: { model: MapModel; land: readonly LatLng[]; warehouse: MapWarehouse }) {
  const phone = usePhone();
  const [hover, setHover] = useState<number | null>(null);
  const hovered = hover === null ? null : (model.drones[hover] ?? null);

  const routes = useMemo(
    () => model.drones.map((d) => ({ arc: d.arc, color: glow(STATUS_TOKEN[d.delay.status], 1.3) })),
    [model],
  );
  const drones = useMemo(
    () => model.drones.map((d) => ({ position: d.position, color: glow(STATUS_TOKEN[d.delay.status], 2.2) })),
    [model],
  );

  const { camera, tiltDeg, zoom, dpr, arcSegments } = MAP_CONFIG;
  return (
    <div className="relative h-full w-full touch-none" style={{ cursor: hovered ? "pointer" : undefined }}>
      <Canvas
        dpr={[1, phone ? dpr.phone : dpr.desktop]}
        camera={{ position: [...camera.position], fov: camera.fov, near: 0.5, far: 1200 }}
      >
        <Atmosphere />
        <Land cells={land} />
        <Warehouse at={warehouse} name={warehouse.name} height={towerHeight(warehouse.units)} flag={warehouse.flag} />
        <RouteArcs routes={routes} segments={arcSegments} />
        <CargoDrones drones={drones} onHover={setHover} onSelect={setHover} />
        <Pins pins={model.pins} />
        {/* Tilt from the ground maps to polar angle from straight down: 20°–70° either way. */}
        <MapControls
          makeDefault
          target={[...camera.target]}
          minPolarAngle={rad(90 - tiltDeg.max)}
          maxPolarAngle={rad(90 - tiltDeg.min)}
          minDistance={zoom.min}
          maxDistance={zoom.max}
          enableDamping
        />
        <Effects />
      </Canvas>
      <Legend counts={model.counts} hiddenCount={model.hiddenCount} />
      {hovered && <ShipmentHover item={hovered} />}
    </div>
  );
}
