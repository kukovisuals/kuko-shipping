import type { LatLng } from "@/domain/map/project";

// Land as a grid of square cells `cellDeg` wide, starting at the north-west corner (west, north).
// Row 0 is the northern band, column 0 the western one. "1" = land.
export type GridSpec = { west: number; north: number; cellDeg: number; width: number; height: number };
export type LandGrid = GridSpec & { rows: string[] };

/** The whole world at 1°. */
export const WORLD_GRID: GridSpec = { west: -180, north: 90, cellDeg: 1, width: 360, height: 180 };

/** A grid covering a lat/lng box at `cellDeg`, rounded out to whole cells. */
export function gridFor(b: { west: number; east: number; south: number; north: number }, cellDeg: number): GridSpec {
  return {
    west: b.west,
    north: b.north,
    cellDeg,
    width: Math.ceil((b.east - b.west) / cellDeg),
    height: Math.ceil((b.north - b.south) / cellDeg),
  };
}

/** [lng, lat] pairs, closed or not. */
export type Ring = readonly (readonly [number, number])[];
/** Outer ring first, then holes — the GeoJSON polygon shape. */
export type Polygon = readonly Ring[];

export function cellCenter(g: GridSpec, col: number, row: number): LatLng {
  return { lat: g.north - (row + 0.5) * g.cellDeg, lng: g.west + (col + 0.5) * g.cellDeg };
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
export function rasterize(polygons: readonly Polygon[], spec: GridSpec = WORLD_GRID): LandGrid {
  const boxed = polygons.map((p) => {
    const lngs = p[0].map(([x]) => x);
    const lats = p[0].map(([, y]) => y);
    return { p, minX: Math.min(...lngs), maxX: Math.max(...lngs), minY: Math.min(...lats), maxY: Math.max(...lats) };
  });
  const rows: string[] = [];
  for (let row = 0; row < spec.height; row++) {
    let line = "";
    for (let col = 0; col < spec.width; col++) {
      const { lat, lng } = cellCenter(spec, col, row);
      const land = boxed.some(
        (b) => lng >= b.minX && lng <= b.maxX && lat >= b.minY && lat <= b.maxY && inPolygon(b.p, lng, lat),
      );
      line += land ? "1" : "0";
    }
    rows.push(line);
  }
  return { ...spec, rows };
}

/** The centre of every land cell. */
export function landCells(grid: LandGrid): LatLng[] {
  const cells: LatLng[] = [];
  grid.rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) if (line[col] === "1") cells.push(cellCenter(grid, col, row));
  });
  return cells;
}

export function isLand(grid: LandGrid, { lat, lng }: LatLng): boolean {
  const row = Math.floor((grid.north - lat) / grid.cellDeg);
  const col = Math.floor((lng - grid.west) / grid.cellDeg);
  return row >= 0 && col >= 0 && grid.rows[Math.min(grid.height - 1, row)]?.[Math.min(grid.width - 1, col)] === "1";
}

/** Douglas–Peucker: drops points closer than `tolerance` degrees to the line they sit on. */
export function simplifyRing(ring: Ring, tolerance: number): [number, number][] {
  if (ring.length <= 3) return ring.map(([x, y]) => [x, y]);
  const keep = new Uint8Array(ring.length);
  keep[0] = keep[ring.length - 1] = 1;
  const stack: [number, number][] = [[0, ring.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    const len = Math.hypot(bx - ax, by - ay);
    let worst = -1;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      const [px, py] = ring[k];
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > worst) [worst, at] = [d, k];
    }
    if (worst > tolerance) {
      keep[at] = 1;
      stack.push([i, at], [at, j]);
    }
  }
  return ring.filter((_, k) => keep[k]).map(([x, y]) => [x, y]);
}
