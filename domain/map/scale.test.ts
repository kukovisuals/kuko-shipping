import { describe, expect, it } from "vitest";
import { pinRadius } from "./scale";

describe("pinRadius", () => {
  it("grows with the log of the count, capped", () => {
    expect(pinRadius(1)).toBeCloseTo(0.16, 10);
    expect(pinRadius(4)).toBeCloseTo(0.22, 10);
    expect(pinRadius(256)).toBeCloseTo(0.4, 10);
    expect(pinRadius(1e9)).toBe(0.5);
    expect(pinRadius(0)).toBe(pinRadius(1));
  });
});
