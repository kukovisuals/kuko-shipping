import { describe, expect, it } from "vitest";
import { WORLD_GRID, cellCenter, gridFor, inPolygon, inRing, isLand, landCells, rasterize, simplifyRing, type Polygon } from "./land";

const square = (x0: number, y0: number, x1: number, y1: number) =>
  [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ] as const;

describe("cellCenter", () => {
  it("puts row 0 / col 0 at the north-west corner", () => {
    expect(cellCenter(WORLD_GRID, 0, 0)).toEqual({ lat: 89.5, lng: -179.5 });
    expect(cellCenter(WORLD_GRID, 359, 179)).toEqual({ lat: -89.5, lng: 179.5 });
  });

  it("works for a finer grid over a smaller box", () => {
    const g = gridFor({ west: -125, east: -66, south: 24, north: 50 }, 0.25);
    expect(g).toMatchObject({ width: 236, height: 104 });
    expect(cellCenter(g, 0, 0)).toEqual({ lat: 49.875, lng: -124.875 });
  });
});

describe("inRing / inPolygon", () => {
  it("tests points against a ring", () => {
    expect(inRing(square(0, 0, 10, 10), 5, 5)).toBe(true);
    expect(inRing(square(0, 0, 10, 10), 15, 5)).toBe(false);
  });

  it("leaves holes out", () => {
    const donut: Polygon = [square(0, 0, 10, 10), square(4, 4, 6, 6)];
    expect(inPolygon(donut, 2, 2)).toBe(true);
    expect(inPolygon(donut, 5, 5)).toBe(false);
  });
});

describe("rasterize / landCells / isLand", () => {
  const grid = rasterize([[square(0, 0, 3, 2)]]); // 3 × 2 cells north-east of 0°/0°

  it("makes a 360 × 180 grid", () => {
    expect(grid.width).toBe(360);
    expect(grid.height).toBe(180);
    expect(grid.rows).toHaveLength(180);
    expect(grid.rows.every((r) => r.length === 360)).toBe(true);
  });

  it("marks the cells whose centres are inside", () => {
    const cells = landCells(grid);
    expect(cells).toHaveLength(6);
    expect(cells).toContainEqual({ lat: 0.5, lng: 0.5 });
    expect(cells).toContainEqual({ lat: 1.5, lng: 2.5 });
  });

  it("looks up a point's cell", () => {
    expect(isLand(grid, { lat: 1.2, lng: 2.9 })).toBe(true);
    expect(isLand(grid, { lat: -0.5, lng: 1 })).toBe(false);
    expect(isLand(grid, { lat: -90, lng: 180 })).toBe(false); // edge stays in range
  });

  it("rasterizes a fine grid and leaves points outside it as sea", () => {
    const g = rasterize([[square(0, 0, 1, 1)]], gridFor({ west: -1, east: 2, south: -1, north: 2 }, 0.25));
    expect(landCells(g)).toHaveLength(16);
    expect(isLand(g, { lat: 0.6, lng: 0.6 })).toBe(true);
    expect(isLand(g, { lat: 5, lng: 0.6 })).toBe(false);
    expect(isLand(g, { lat: 0.6, lng: -5 })).toBe(false);
  });
});

describe("simplifyRing", () => {
  it("drops points that sit on a straight edge and keeps the corners", () => {
    const ring = [[0, 0], [1, 0.001], [2, 0], [2, 2], [0, 2], [0, 0]] as const;
    expect(simplifyRing(ring, 0.01)).toEqual([[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]);
  });

  it("keeps a point that bends more than the tolerance", () => {
    const ring = [[0, 0], [1, 0.5], [2, 0], [2, 2], [0, 0]] as const;
    expect(simplifyRing(ring, 0.1)).toHaveLength(5);
  });
});
