"use client";

import { MapControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { MAP_CONFIG } from "@/config/map";
import { MAP } from "@/domain/map/project";
import type { Region } from "@/domain/map/regions";
import { towerHeight } from "@/domain/map/scale";
import type { StateCode } from "@/domain/map/usStates";
import { Atmosphere } from "@/engine/Atmosphere";
import { STATUS_TOKEN } from "@/engine/colors";
import { Dock } from "@/engine/Dock";
import { Effects } from "@/engine/Effects";
import { FitView } from "@/engine/FitView";
import { Label } from "@/engine/Label";
import { PaletteProvider, usePalette } from "@/engine/palette";
import { Pins } from "@/engine/Pins";
import { TRUCK, Trucks } from "@/engine/Trucks";
import { usePhone } from "@/engine/useMedia";
import { Warehouse } from "@/engine/Warehouse";
import type { Look } from "@/ui/theme";
import type { LayerProps, MapLand, MapWarehouse } from "./layers";
import { Legend } from "./Legend";
import type { MapModel, MapTruck } from "./model";
import { RegionLayer } from "./RegionLayer";
import { RegionPanel } from "./RegionPanel";
import { TruckCard, TruckHover } from "./TruckCard";

export type { MapLand, MapWarehouse } from "./layers";

const rad = (deg: number) => (deg * Math.PI) / 180;

export function MapScene({
  model,
  land,
  warehouse,
  look,
  onLook,
}: {
  model: MapModel;
  land: MapLand;
  warehouse: MapWarehouse;
  look: Look;
  onLook: (look: Look) => void;
}) {
  const phone = usePhone();
  // One region's trucks at a time, so the country never fills with every truck at once.
  const [region, setRegion] = useState<Region | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ key: string; order: string | null } | null>(null);

  const toggleRegion = (r: Region) => {
    setRegion((cur) => (cur === r ? null : r));
    setPicked(null);
    setHover(null);
  };

  // Escape closes the truck card, then the region.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (picked) setPicked(null);
      else setRegion(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked]);

  const drawn = useMemo(() => (region ? model.trucks.filter((t) => t.region === region) : []), [model, region]);

  // Keyed by truck, so a 60 s refresh keeps the same truck open.
  const selected = picked ? (drawn.find((t) => t.key === picked.key) ?? null) : null;
  const selectedOrder = selected && picked?.order ? (selected.orders.find((o) => o.id === picked.order) ?? null) : null;
  const hovered = hover === null ? null : (drawn[hover] ?? null);

  // One late or at-risk truck per state in the open region, worst first.
  const callouts = useMemo(() => {
    if (!region) return [];
    const seen = new Set<StateCode>();
    const out: MapTruck[] = [];
    for (const t of model.regions[region].problems) {
      if (seen.has(t.state)) continue;
      seen.add(t.state);
      out.push(t);
    }
    return out.slice(0, MAP_CONFIG.maxCallouts);
  }, [model, region]);

  const layer: LayerProps = { model, land, region, drawn, callouts, ground: MAP.landHeight, onRegion: toggleRegion };

  const { camera, tiltDeg, zoom, dpr } = MAP_CONFIG;
  return (
    <div className="relative h-full w-full touch-none" style={{ cursor: hovered ? "pointer" : undefined }}>
      <PaletteProvider look={look}>
        <Canvas
          dpr={[1, phone ? dpr.phone : dpr.desktop]}
          camera={{ position: [camera.target[0] + camera.offset[0], camera.offset[1], camera.target[2] + camera.offset[2]], fov: camera.fov, near: 0.3, far: 900 }}
          onPointerMissed={() => setPicked(null)}
        >
          <Atmosphere />
          <RegionLayer {...layer} />
          <Fleet layer={layer} warehouse={warehouse} hovered={hovered} selected={selected} onHover={setHover} onSelect={(i) => setPicked({ key: drawn[i].key, order: null })} />
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
      </PaletteProvider>
      <Legend
        counts={model.counts}
        onRoad={model.trucks.filter((t) => !t.loading).length}
        loading={model.trucks.filter((t) => t.loading).length}
        hiddenCount={model.hiddenCount}
      />
      <RegionPanel
        regions={model.regions}
        open={region}
        onToggle={toggleRegion}
        onPick={(t) => setPicked({ key: t.key, order: null })}
        look={look}
        onLook={onLook}
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

/** The fleet on top of the map: the warehouse, the open region's trucks with their badges, its
 * loading dock and its destination pins. */
function Fleet({
  layer: { model, region, drawn, ground },
  warehouse,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  layer: LayerProps;
  warehouse: MapWarehouse;
  hovered: MapTruck | null;
  selected: MapTruck | null;
  onHover: (i: number | null) => void;
  onSelect: (i: number) => void;
}) {
  const { glow } = usePalette();
  const trucks = useMemo(
    () =>
      drawn.map((t) => ({
        position: { ...t.position, y: ground },
        heading: t.heading,
        color: glow(STATUS_TOKEN[t.status], t.status === "on_time" ? 1.4 : 2.2),
      })),
    [drawn, ground, glow],
  );
  const pins = useMemo(() => model.pins.filter((p) => p.region === region), [model, region]);

  // Count badges for the biggest loads on the road, plus whichever truck is hovered or picked.
  // The dock gets one label for all of its trucks.
  const badges = useMemo(() => {
    const keep = new Set(
      drawn
        .filter((t) => !t.loading && t.orders.length >= MAP_CONFIG.minBadgeOrders)
        .sort((a, b) => b.orders.length - a.orders.length)
        .slice(0, MAP_CONFIG.maxBadges)
        .map((t) => t.key),
    );
    if (hovered) keep.add(hovered.key);
    if (selected) keep.add(selected.key);
    return drawn.filter((t) => keep.has(t.key));
  }, [drawn, hovered, selected]);

  const yard = region ? model.yards[region] : null;
  return (
    <>
      <Warehouse at={warehouse} name={warehouse.name} height={towerHeight(warehouse.units)} flag={warehouse.flag} />
      <Trucks trucks={trucks} onHover={onHover} onSelect={onSelect} />
      {badges.map((t) => (
        <Label
          key={t.key}
          text={String(t.orders.length)}
          position={[t.position.x, ground + TRUCK.clearance + TRUCK.height + 0.12, t.position.z]}
          size={0.55}
          color={STATUS_TOKEN[t.status]}
        />
      ))}
      {yard && yard.trucks > 0 && (
        <>
          <Dock box={yard} y={ground} />
          <Label text={`Loading · ${yard.orders} orders`} position={[(yard.west + yard.east) / 2, ground + 0.6, -yard.north]} size={0.6} color="muted" />
        </>
      )}
      <Pins pins={pins} />
    </>
  );
}
