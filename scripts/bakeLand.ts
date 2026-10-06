// Bakes Natural Earth 1:110m land (public domain) into public/map/land.json, a 1° grid.
// Source: scripts/data/ne_110m_land.geojson (downloaded once; see docs/workflow.md).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { landCells, rasterize, type Polygon } from "@/domain/map/land";

type Geometry = { type: "Polygon"; coordinates: Polygon } | { type: "MultiPolygon"; coordinates: Polygon[] };

const SOURCE = "scripts/data/ne_110m_land.geojson";
const OUT = "public/map/land.json";

const geo = JSON.parse(readFileSync(SOURCE, "utf8")) as { features: { geometry: Geometry | null }[] };
const polygons = geo.features.flatMap(({ geometry: g }) =>
  !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [],
);

const grid = rasterize(polygons);
mkdirSync("public/map", { recursive: true });
writeFileSync(OUT, JSON.stringify(grid));
console.log(`${OUT}: ${polygons.length} polygons → ${landCells(grid).length} land cells`);
