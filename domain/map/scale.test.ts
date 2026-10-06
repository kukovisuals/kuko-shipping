import { describe, expect, it } from "vitest";
import { TOWER, pinHeight, towerHeight } from "./scale";

describe("towerHeight", () => {
  it("runs from 2 for an empty warehouse to 10 at the top of the scale", () => {
    expect(towerHeight(0)).toBe(TOWER.minHeight);
    expect(towerHeight(TOWER.unitsAtMax)).toBeCloseTo(TOWER.maxHeight, 10);
    expect(towerHeight(10_000_000)).toBe(TOWER.maxHeight);
  });

  it("grows on a log scale", () => {
    const h100 = towerHeight(100);
    const h1000 = towerHeight(1000);
    const h10000 = towerHeight(10_000);
    expect(h1000 - h100).toBeCloseTo(h10000 - h1000, 1);
    expect(towerHeight(-5)).toBe(TOWER.minHeight);
  });
});

describe("pinHeight", () => {
  it("grows with the log of the count", () => {
    expect(pinHeight(1)).toBeCloseTo(0.2, 10);
    expect(pinHeight(4)).toBeCloseTo(0.5, 10);
    expect(pinHeight(256)).toBeCloseTo(1.4, 10);
    expect(pinHeight(0)).toBe(pinHeight(1));
  });
});
