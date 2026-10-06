import { describe, expect, it } from "vitest";
import { mergePins } from "./pins";

const denver = (dLat: number, dLng: number, id: string) => ({ id, lat: 39.74 + dLat, lng: -104.99 + dLng });

describe("mergePins", () => {
  it("merges points closer than 0.5° into one pin with a count", () => {
    const pins = mergePins([denver(0, 0, "a"), denver(0.2, -0.1, "b"), denver(-0.3, 0.1, "c")]);
    expect(pins).toHaveLength(1);
    expect(pins[0].count).toBe(3);
    expect(pins[0].items.map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("chains neighbours, so one city's scattered orders become one pin", () => {
    const offsets = [-0.3, -0.15, 0, 0.15, 0.3];
    const city = offsets.flatMap((dLat) => offsets.map((dLng) => denver(dLat, dLng, `${dLat},${dLng}`)));
    const pins = mergePins([...city, { id: "nyc", lat: 40.71, lng: -74.01 }]);
    expect(pins.map((p) => p.count).sort((a, b) => a - b)).toEqual([1, 25]);
  });

  it("places the pin at the mean of its points", () => {
    const [pin] = mergePins([denver(0, 0, "a"), denver(0.2, 0, "b")]);
    expect(pin.lat).toBeCloseTo(39.84, 10);
    expect(pin.lng).toBeCloseTo(-104.99, 10);
  });

  it("keeps points 0.5° or more apart separate", () => {
    expect(mergePins([denver(0, 0, "a"), denver(0.5, 0, "b")])).toHaveLength(2);
    expect(
      mergePins([
        { lat: 40.71, lng: -74.01 },
        { lat: 42.36, lng: -71.06 },
      ]),
    ).toHaveLength(2);
  });

  it("gives the same pins whatever the input order", () => {
    const points = [denver(0, 0, "a"), denver(0.4, 0, "b"), denver(0.8, 0, "c"), denver(1.2, 0, "d")];
    const shape = (ps: { items: { id: string }[] }[]) => ps.map((p) => p.items.map((i) => i.id).join(""));
    expect(shape(mergePins(points))).toEqual(shape(mergePins([...points].reverse())));
  });

  it("returns nothing for no points", () => {
    expect(mergePins([])).toEqual([]);
  });
});
