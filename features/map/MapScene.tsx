"use client";

import { MapControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { MAP_CONFIG } from "@/config/map";
import { MAP, type LatLng, type Vec3 } from "@/domain/map/project";
import { towerHeight } from "@/domain/map/scale";
import type { StockFlag } from "@/domain/stock/lowStock";
import { Atmosphere } from "@/engine/Atmosphere";
import { STATUS_TOKEN, glow } from "@/engine/colors";
import { Dock } from "@/engine/Dock";
import { Effects } from "@/engine/Effects";
import { FitView } from "@/engine/FitView";
import { Label } from "@/engine/Label";
import { Land } from "@/engine/Land";
import { Lines } from "@/engine/Lines";
import { Pins } from "@/engine/Pins";
import { TRUCK, Trucks } from "@/engine/Trucks";
import { usePhone } from "@/engine/useMedia";
import { Warehouse } from "@/engine/Warehouse";
import { Legend } from "./Legend";
import type { MapModel } from "./model";
import { TruckCard, TruckHover } from "./TruckCard";

export type MapWarehouse = LatLng & { name: string; units: number; flag: StockFlag };
export type MapLand = {
  cells: readonly LatLng[];
  cellDeg: number;
  bounds: { west: number; east: number; south: number; north: number };
  /** State outlines as [lng, lat] rings. */
  outlines: readonly (readonly (readonly [number, number])[])[];
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const GROUND = MAP.landCellHeight;

export function MapScene({ model, land, warehouse }: { model: MapModel; land: MapLand; warehouse: MapWarehouse }) {
  const phone = usePhone();
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ key: string; order: string | null } | null>(null);

  // Keyed by truck, so a 60 s refresh keeps the same truck open.
  const selected = picked ? (model.trucks.find((t) => t.key === picked.key) ?? null) : null;
  const selectedOrder = selected && picked?.order ? (selected.orders.find((o) => o.id === picked.order) ?? null) : null;
  const hovered = hover === null ? null : (model.trucks[hover] ?? null);

  const trucks = useMemo(
    () =>
      model.trucks.map((t) => ({
        position: { ...t.position, y: GROUND },
        heading: t.heading,
        color: glow(STATUS_TOKEN[t.status], t.status === "on_time" ? 1.4 : 2.2),
      })),
    [model],
  );
  const roads = useMemo(
    () => model.roads.map((r): [Vec3, Vec3] => [{ ...r.a, y: GROUND + 0.01 }, { ...r.b, y: GROUND + 0.01 }]),
    [model],
  );
  const borders = useMemo(
    () =>
      land.outlines.flatMap((ring) =>
        ring.slice(1).map(([lng, lat], i): [Vec3, Vec3] => [
          { x: ring[i][0], y: GROUND + 0.005, z: -ring[i][1] },
          { x: lng, y: GROUND + 0.005, z: -lat },
        ]),
      ),
    [land],
  );
  const colors = useMemo(() => ({ border: glow("neon", 0.9), road: glow("flow", 0.8) }), []);

  // Count badges for the biggest loads on the road, plus whichever truck is hovered or picked.
  // The dock gets one label for all of its trucks.
  const badges = useMemo(() => {
    const keep = new Set(
      model.trucks
        .filter((t) => !t.loading && t.orders.length >= MAP_CONFIG.minBadgeOrders)
        .sort((a, b) => b.orders.length - a.orders.length)
        .slice(0, MAP_CONFIG.maxBadges)
        .map((t) => t.key),
    );
    if (hovered) keep.add(hovered.key);
    if (selected) keep.add(selected.key);
    return model.trucks.filter((t) => keep.has(t.key));
  }, [model, hovered, selected]);

  const { camera, tiltDeg, zoom, dpr } = MAP_CONFIG;
  return (
    <div className="relative h-full w-full touch-none" style={{ cursor: hovered ? "pointer" : undefined }}>
      <Canvas
        dpr={[1, phone ? dpr.phone : dpr.desktop]}
        camera={{ position: [camera.target[0] + camera.offset[0], camera.offset[1], camera.target[2] + camera.offset[2]], fov: camera.fov, near: 0.3, far: 900 }}
        onPointerMissed={() => setPicked(null)}
      >
        <Atmosphere />
        <Land cells={land.cells} cellDeg={land.cellDeg} bounds={land.bounds} />
        <Lines segments={borders} color={colors.border} opacity={0.6} />
        <Lines segments={roads} color={colors.road} opacity={0.35} />
        <Warehouse at={warehouse} name={warehouse.name} height={towerHeight(warehouse.units)} flag={warehouse.flag} />
        <Trucks trucks={trucks} onHover={setHover} onSelect={(i) => setPicked({ key: model.trucks[i].key, order: null })} />
        {badges.map((t) => (
          <Label
            key={t.key}
            text={String(t.orders.length)}
            position={[t.position.x, GROUND + TRUCK.clearance + TRUCK.height + 0.12, t.position.z]}
            size={0.55}
            color={STATUS_TOKEN[t.status]}
          />
        ))}
        <Dock box={model.yard} y={GROUND} />
        <Label
          text={`Loading · ${model.yard.orders} orders`}
          position={[(model.yard.west + model.yard.east) / 2, GROUND + 0.6, -model.yard.north]}
          size={0.6}
          color="muted"
        />
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
        <FitView target={camera.target} offset={camera.offset} scale={phone ? camera.phoneDistanceScale : 1} />
        <Effects />
      </Canvas>
      <Legend
        counts={model.counts}
        onRoad={model.trucks.length - model.yard.trucks}
        loading={model.yard.trucks}
        hiddenCount={model.hiddenCount}
      />
      {selected ? (
        <TruckCard
          truck={selected}
          order={selectedOrder}
          onOrder={(id) => setPicked({ key: selected.key, order: id })}
          onClose={() => setPicked(null)}
        />
      ) : (
        hovered && <TruckHover truck={hovered} />
      )}
    </div>
  );
}
