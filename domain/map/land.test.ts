import { describe, expect, it } from "vitest";
import { cellCenter, inPolygon, inRing, isLand, landCells, rasterize, type Polygon } from "./land";

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
    expect(cellCenter(0, 0)).toEqual({ lat: 89.5, lng: -179.5 });
    expect(cellCenter(359, 179)).toEqual({ lat: -89.5, lng: 179.5 });
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
});
