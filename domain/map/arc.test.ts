import { describe, expect, it } from "vitest";
import { arcHeight, arcPoint, arcPoints, makeArc, nearestT } from "./arc";
import { insideMap } from "./bounds";
import { MAP } from "./project";

const W01 = { lat: 42.94, lng: -73.8 };
const BOSTON = { lat: 42.36, lng: -71.06 };
const SYDNEY = { lat: -33.87, lng: 151.21 };
const LONDON = { lat: 51.51, lng: -0.13 };

describe("arcHeight", () => {
  it("is 0.25 × distance, clamped to [2, 30]", () => {
    expect(arcHeight(40)).toBe(10);
    expect(arcHeight(1)).toBe(MAP.arc.minHeight);
    expect(arcHeight(500)).toBe(MAP.arc.maxHeight);
  });
});

describe("makeArc / arcPoint", () => {
  it("starts at A, ends at B, and peaks at h when t = ½", () => {
    const arc = makeArc(W01, LONDON);
    expect(arcPoint(arc, 0)).toEqual(arc.a);
    expect(arcPoint(arc, 1)).toEqual(arc.b);
    const mid = arcPoint(arc, 0.5);
    expect(mid.y).toBeCloseTo(arc.height, 10);
    expect(mid.x).toBeCloseTo((arc.a.x + arc.b.x) / 2, 10);
  });

  it("matches the spec's Bézier P(t) = (1 − t)² A + 2 (1 − t) t C + t² B", () => {
    const arc = makeArc(W01, SYDNEY);
    for (const t of [0.1, 0.33, 0.5, 0.8]) {
      const u = 1 - t;
      const bez = (k: "x" | "y" | "z") => u * u * arc.a[k] + 2 * u * t * arc.c[k] + t * t * arc.b[k];
      const p = arcPoint(arc, t);
      expect(p.x).toBeCloseTo(bez("x"), 9);
      expect(p.y).toBeCloseTo(bez("y"), 9);
      expect(p.z).toBeCloseTo(bez("z"), 9);
    }
  });

  it("never rises above h", () => {
    const arc = makeArc(W01, LONDON);
    const top = Math.max(...arcPoints(arc, 200).map((p) => p.y));
    expect(top).toBeLessThanOrEqual(arc.height + 1e-9);
  });

  it("gives short hops the minimum height", () => {
    expect(makeArc(W01, BOSTON).height).toBe(MAP.arc.minHeight);
  });

  it("draws a route over the date line the long way, inside the map", () => {
    const arc = makeArc(W01, SYDNEY);
    expect(arc.longWay).toBe(true);
    for (const p of arcPoints(arc, 100)) expect(insideMap(p)).toBe(true);
    expect(arcPoint(arc, 0.5).x).toBeCloseTo((W01.lng + SYDNEY.lng) / 2, 10);
  });

  it("keeps every arc between map corners inside the map", () => {
    const corners = [
      { lat: 90, lng: -180 },
      { lat: 90, lng: 180 },
      { lat: -90, lng: -180 },
      { lat: -90, lng: 180 },
      { lat: 0, lng: 0 },
    ];
    for (const from of corners) {
      for (const to of corners) {
        for (const p of arcPoints(makeArc(from, to), 50)) {
          expect(insideMap(p)).toBe(true);
          expect(p.y).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("is not long-way for a normal route", () => {
    expect(makeArc(W01, LONDON).longWay).toBe(false);
  });
});

describe("nearestT", () => {
  const arc = makeArc({ lat: 0, lng: 0 }, { lat: 0, lng: 100 });

  it("projects a ground point onto the route", () => {
    expect(nearestT(arc, { x: 25, z: 0 })).toBeCloseTo(0.25, 10);
    expect(nearestT(arc, { x: 60, z: -10 })).toBeCloseTo(0.6, 10);
  });

  it("clamps to the ends", () => {
    expect(nearestT(arc, { x: -20, z: 0 })).toBe(0);
    expect(nearestT(arc, { x: 140, z: 0 })).toBe(1);
  });

  it("returns 0 when A and B are the same point", () => {
    expect(nearestT(makeArc(W01, W01), { x: 0, z: 0 })).toBe(0);
  });
});
