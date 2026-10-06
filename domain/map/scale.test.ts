import { describe, expect, it } from "vitest";
import { pinHeight } from "./scale";

describe("pinHeight", () => {
  it("grows with the log of the count", () => {
    expect(pinHeight(1)).toBeCloseTo(0.2, 10);
    expect(pinHeight(4)).toBeCloseTo(0.5, 10);
    expect(pinHeight(256)).toBeCloseTo(1.4, 10);
    expect(pinHeight(0)).toBe(pinHeight(1));
  });
});
