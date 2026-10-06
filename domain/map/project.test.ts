import { describe, expect, it } from "vitest";
import { MAP, project, unproject } from "./project";

describe("project", () => {
  it("maps lng to x and lat to -z on the ground", () => {
    expect(project({ lat: 42.94, lng: -73.8 })).toEqual({ x: -73.8, y: 0, z: -42.94 });
    expect(project({ lat: -33.87, lng: 151.21 }, 3)).toEqual({ x: 151.21, y: 3, z: 33.87 });
  });

  it("gives 0, not -0, on the equator", () => {
    expect(project({ lat: 0, lng: 0 })).toEqual({ x: 0, y: 0, z: 0 });
    expect(unproject({ x: 0, z: 0 })).toEqual({ lat: 0, lng: 0 });
  });

  it("round-trips through unproject", () => {
    const p = { lat: 51.51, lng: -0.13 };
    expect(unproject(project(p))).toEqual(p);
  });

  it("puts the map corners at ±180 × ±90", () => {
    expect(project({ lat: 90, lng: -180 })).toEqual({ x: -180, y: 0, z: -90 });
    expect(project({ lat: -90, lng: 180 })).toEqual({ x: 180, y: 0, z: 90 });
    expect(MAP.width).toBe(360);
    expect(MAP.height).toBe(180);
  });
});
