import { MAP, type LatLng } from "@/domain/map/project";

// The world as a 1° grid: row 0 is the band 90°N–89°N, column 0 is 180°W–179°W. "1" = land.
export type LandGrid = { width: number; height: number; rows: string[] };

/** [lng, lat] pairs, closed or not. */
export type Ring = readonly (readonly [number, number])[];
/** Outer ring first, then holes — the GeoJSON polygon shape. */
export type Polygon = readonly Ring[];

export function cellCenter(col: number, row: number): LatLng {
  return { lat: 90 - row - 0.5, lng: -180 + col + 0.5 };
}

/** Even-odd ray cast. */
export function inRing(ring: Ring, lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function inPolygon([outer, ...holes]: Polygon, lng: number, lat: number): boolean {
  return inRing(outer, lng, lat) && !holes.some((h) => inRing(h, lng, lat));
}

/** A cell is land when its centre is inside any polygon. */
export function rasterize(polygons: readonly Polygon[]): LandGrid {
  const width = MAP.width;
  const height = MAP.height;
  const boxed = polygons.map((p) => {
    const lngs = p[0].map(([x]) => x);
    const lats = p[0].map(([, y]) => y);
    return { p, minX: Math.min(...lngs), maxX: Math.max(...lngs), minY: Math.min(...lats), maxY: Math.max(...lats) };
  });
  const rows: string[] = [];
  for (let row = 0; row < height; row++) {
    let line = "";
    for (let col = 0; col < width; col++) {
      const { lat, lng } = cellCenter(col, row);
      const land = boxed.some(
        (b) => lng >= b.minX && lng <= b.maxX && lat >= b.minY && lat <= b.maxY && inPolygon(b.p, lng, lat),
      );
      line += land ? "1" : "0";
    }
    rows.push(line);
  }
  return { width, height, rows };
}

/** The centre of every land cell. */
export function landCells(grid: LandGrid): LatLng[] {
  const cells: LatLng[] = [];
  grid.rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) if (line[col] === "1") cells.push(cellCenter(col, row));
  });
  return cells;
}

export function isLand(grid: LandGrid, { lat, lng }: LatLng): boolean {
  const row = Math.min(grid.height - 1, Math.floor(90 - lat));
  const col = Math.min(grid.width - 1, Math.floor(lng + 180));
  return grid.rows[row]?.[col] === "1";
}
