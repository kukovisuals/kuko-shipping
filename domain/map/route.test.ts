import { describe, expect, it } from "vitest";
import { makeRoute, routePoint } from "./route";

const W01 = { lat: 42.94, lng: -73.8 };
const LA = { lat: 34.05, lng: -118.24 };

describe("makeRoute", () => {
  it("runs on the ground from the warehouse to the destination", () => {
    const r = makeRoute(W01, LA);
    expect(r.a).toEqual({ x: -73.8, y: 0, z: -42.94 });
    expect(r.b).toEqual({ x: -118.24, y: 0, z: -34.05 });
    expect(r.length).toBeCloseTo(Math.hypot(44.44, 8.89), 6);
  });

  it("heads the truck's +X axis along the route", () => {
    const east = makeRoute({ lat: 0, lng: 0 }, { lat: 0, lng: 10 });
    expect(east.heading).toBeCloseTo(0, 10);
    const north = makeRoute({ lat: 0, lng: 0 }, { lat: 10, lng: 0 });
    expect(north.heading).toBeCloseTo(Math.PI / 2, 10); // +X turned 90° about +Y points to −Z (north)
    const west = makeRoute(W01, LA);
    expect(Math.cos(west.heading)).toBeLessThan(0);
  });
});

describe("routePoint", () => {
  const r = makeRoute({ lat: 0, lng: 0 }, { lat: 0, lng: 100 });

  it("moves linearly and stays between the ends", () => {
    expect(routePoint(r, 0.25)).toEqual({ x: 25, y: 0, z: 0 });
    expect(routePoint(r, 1.5).x).toBe(100);
    expect(routePoint(r, -1).x).toBe(0);
    expect(routePoint(r, 0.5, 2).y).toBe(2);
  });
});
