import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";

describe("BRAND", () => {
  it("labels the demo as simulated", () => {
    expect(BRAND.simulatedTag).toBe("Simulated data");
    expect(BRAND.disclaimer).toMatch(/simulated/i);
    expect(BRAND.disclaimer).toContain(BRAND.demoClient);
  });
});
