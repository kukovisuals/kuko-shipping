// Bakes the lower 48 states + DC from Natural Earth 1:50m admin-1 (public domain) into
// public/map/us.json: a 0.25° land grid plus simplified state outlines.
// Source: scripts/data/ne_50m_admin_1_states_provinces_lakes.{shp,dbf} (see docs/workflow.md).
import { mkdirSync, writeFileSync } from "node:fs";
import { open } from "shapefile";
import { gridFor, landCells, rasterize, simplifyRing, type Polygon } from "@/domain/map/land";
import { US_BOUNDS, isStateCode } from "@/domain/map/usStates";

const SOURCE = "scripts/data/ne_50m_admin_1_states_provinces_lakes.shp";
const OUT = "public/map/us.json";
const CELL_DEG = 0.25;
const OUTLINE_TOLERANCE_DEG = 0.03;

// dBASE pads text fields with NULs.
const text = (v: unknown) => String(v ?? "").replace(/\0+$/, "");

const source = await open(SOURCE, undefined, { encoding: "utf-8" });
const polygons: Polygon[] = [];
const states = new Set<string>();
for (let r = await source.read(); !r.done; r = await source.read()) {
  const props = r.value.properties as Record<string, unknown>;
  const code = text(props.postal);
  if (text(props.iso_a2) !== "US" || !isStateCode(code)) continue; // drops AK, HI and territories
  states.add(code);
  const g = r.value.geometry;
  const asPolygon = (rings: number[][][]): Polygon => rings.map((ring) => ring.map(([x, y]) => [x, y] as const));
  if (g.type === "Polygon") polygons.push(asPolygon(g.coordinates));
  else if (g.type === "MultiPolygon") polygons.push(...g.coordinates.map(asPolygon));
}

const grid = rasterize(polygons, gridFor(US_BOUNDS, CELL_DEG));
const round = (v: number) => Math.round(v * 1000) / 1000;
const outlines = polygons
  .flatMap((p) => p.map((ring) => simplifyRing(ring, OUTLINE_TOLERANCE_DEG)))
  .filter((ring) => ring.length >= 4)
  .map((ring) => ring.map(([x, y]) => [round(x), round(y)]));

mkdirSync("public/map", { recursive: true });
writeFileSync(OUT, JSON.stringify({ grid, outlines }));
console.log(
  `${OUT}: ${states.size} states, ${polygons.length} polygons → ${landCells(grid).length} land cells, ` +
    `${outlines.length} outlines / ${outlines.reduce((s, r) => s + r.length, 0)} points`,
);
