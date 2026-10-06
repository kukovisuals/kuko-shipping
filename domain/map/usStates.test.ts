import { describe, expect, it } from "vitest";
import { US_BOUNDS, US_STATES, isStateCode, usState } from "./usStates";

describe("US_STATES", () => {
  it("has the lower 48 plus DC, each once", () => {
    expect(US_STATES).toHaveLength(49);
    expect(new Set(US_STATES.map((s) => s.code)).size).toBe(49);
    expect(isStateCode("AK")).toBe(false);
    expect(isStateCode("HI")).toBe(false);
  });

  it("puts every anchor inside the map's US bounds", () => {
    for (const s of US_STATES) {
      expect(s.lat).toBeGreaterThan(US_BOUNDS.south);
      expect(s.lat).toBeLessThan(US_BOUNDS.north);
      expect(s.lng).toBeGreaterThan(US_BOUNDS.west);
      expect(s.lng).toBeLessThan(US_BOUNDS.east);
    }
  });

  it("looks a state up by code", () => {
    expect(usState("CA")).toMatchObject({ name: "California", city: "Los Angeles" });
  });
});
