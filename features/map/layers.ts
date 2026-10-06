import type { Region } from "@/domain/map/regions";
import type { StockFlag } from "@/domain/stock/lowStock";
import type { LatLng } from "@/domain/map/project";
import type { MapModel, MapTruck } from "./model";

export type MapWarehouse = LatLng & { id: string; name: string; units: number; flag: StockFlag };
export type MapLand = {
  bounds: { west: number; east: number; south: number; north: number };
  /** State outlines as [lng, lat] rings. */
  outlines: readonly (readonly (readonly [number, number])[])[];
};

/** What the region layer needs to draw the land, roads, region rings and callouts. */
export type LayerProps = {
  model: MapModel;
  land: MapLand;
  /** The open region, or null. */
  region: Region | null;
  /** Trucks drawn: the open region's. */
  drawn: readonly MapTruck[];
  /** One late or at-risk truck per state in the open region, worst first. */
  callouts: readonly MapTruck[];
  ground: number;
  onRegion: (region: Region) => void;
};
