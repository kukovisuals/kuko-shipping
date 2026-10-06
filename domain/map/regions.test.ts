import { describe, expect, it } from "vitest";
import { REGIONS, regionOf, regionStates } from "./regions";
import { US_STATES } from "./usStates";

describe("regions", () => {
  it("puts every state (and DC) in exactly one Census region", () => {
    const all = REGIONS.flatMap((r) => regionStates(r));
    expect(all).toHaveLength(US_STATES.length);
    expect(new Set(all).size).toBe(US_STATES.length);
    for (const s of US_STATES) expect(regionStates(regionOf(s.code))).toContain(s.code);
  });

  it("follows the Census split", () => {
    expect(REGIONS.map((r) => regionStates(r).length)).toEqual([11, 12, 17, 9]);
    expect(regionOf("CO")).toBe("west");
    expect(regionOf("OH")).toBe("midwest");
    expect(regionOf("DC")).toBe("south");
    expect(regionOf("PA")).toBe("northeast");
  });
});
