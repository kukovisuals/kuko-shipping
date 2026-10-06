import { describe, expect, it } from "vitest";
import { makeRoute, routeHeading, routePoint, routeSegments } from "./route";

const W01 = { lat: 42.94, lng: -73.8 };
const LA = { lat: 34.05, lng: -118.24 };

describe("makeRoute", () => {
  it("runs on the ground from the warehouse to the destination", () => {
    const r = makeRoute(W01, LA);
    expect(r.a).toEqual({ x: -73.8, y: 0, z: -42.94 });
    expect(r.b).toEqual({ x: -118.24, y: 0, z: -34.05 });
    expect(r.length).toBeCloseTo(Math.hypot(44.44, 8.89), 6);
  });

  it("bows south going west and west going south", () => {
    const west = makeRoute({ lat: 40, lng: -75 }, { lat: 40, lng: -115 });
    expect(-routePoint(west, 0.5).z).toBeLessThan(40);
    const south = makeRoute({ lat: 42, lng: -80 }, { lat: 26, lng: -80 });
    expect(routePoint(south, 0.5).x).toBeLessThan(-80);
  });

  it("is straight with no bend", () => {
    const r = makeRoute({ lat: 0, lng: 0 }, { lat: 0, lng: 100 }, 0);
    expect(routePoint(r, 0.25)).toEqual({ x: 25, y: 0, z: 0 });
  });

  it("heads the truck's +X axis along the route", () => {
    const east = makeRoute({ lat: 0, lng: 0 }, { lat: 0, lng: 10 });
    expect(east.heading).toBeCloseTo(0, 10);
    expect(routeHeading(east, 0.5)).toBeCloseTo(0, 10); // the middle runs parallel to the chord
    const north = makeRoute({ lat: 0, lng: 0 }, { lat: 10, lng: 0 });
    expect(north.heading).toBeCloseTo(Math.PI / 2, 10); // +X turned 90° about +Y points to −Z (north)
    const west = makeRoute(W01, LA);
    expect(Math.cos(routeHeading(west, 0.2))).toBeLessThan(0);
  });
});

describe("routePoint", () => {
  const r = makeRoute(W01, LA);

  it("starts and ends at the stops and clamps outside [0, 1]", () => {
    expect(routePoint(r, 0)).toEqual(r.a);
    expect(routePoint(r, 1)).toEqual(r.b);
    expect(routePoint(r, -1)).toEqual(r.a);
    expect(routePoint(r, 1.5)).toEqual(r.b);
    expect(routePoint(r, 0.5, 2).y).toBe(2);
  });
});

describe("routeSegments", () => {
  it("joins end to end from a to b", () => {
    const r = makeRoute(W01, LA);
    const segs = routeSegments(r, 8);
    expect(segs).toHaveLength(8);
    expect(segs[0][0]).toEqual(r.a);
    expect(segs[7][1]).toEqual(r.b);
    for (let i = 1; i < 8; i++) expect(segs[i][0]).toEqual(segs[i - 1][1]);
  });
});
