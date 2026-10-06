import { describe, expect, it } from "vitest";
import { clamp, insideMap, isValidLatLng } from "./bounds";

describe("isValidLatLng", () => {
  it("accepts in-range points, including the edges", () => {
    expect(isValidLatLng({ lat: 42.94, lng: -73.8 })).toBe(true);
    expect(isValidLatLng({ lat: -90, lng: 180 })).toBe(true);
  });

  it("refuses out-of-range, missing and non-finite values", () => {
    expect(isValidLatLng({ lat: 90.1, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: -180.5 })).toBe(false);
    expect(isValidLatLng({ lat: Number.NaN, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isValidLatLng({ lat: 10 })).toBe(false);
    expect(isValidLatLng(null)).toBe(false);
  });
});

describe("insideMap", () => {
  it("checks x and z against the 360 × 180 map", () => {
    expect(insideMap({ x: 180, z: -90 })).toBe(true);
    expect(insideMap({ x: 180.01, z: 0 })).toBe(false);
    expect(insideMap({ x: 0, z: 90.01 })).toBe(false);
  });
});

describe("clamp", () => {
  it("keeps a value inside [min, max]", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });
});
