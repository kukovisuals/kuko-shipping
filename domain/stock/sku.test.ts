import { describe, expect, it } from "vitest";
import { isValidSku, normalizeSku } from "./sku";

describe("normalizeSku", () => {
  it("trims and upper-cases", () => {
    expect(normalizeSku("  dw-dark-gr-1lb ")).toBe("DW-DARK-GR-1LB");
  });
});

describe("isValidSku", () => {
  it("accepts demo SKUs", () => {
    expect(isValidSku("DW-DARK-GR-1LB")).toBe(true);
    expect(isValidSku("DW-MUG-BLK-16OZ")).toBe(true);
  });

  it("refuses empty, spaced and over-long SKUs", () => {
    expect(isValidSku("   ")).toBe(false);
    expect(isValidSku("DW DARK")).toBe(false);
    expect(isValidSku("X".repeat(64))).toBe(true);
    expect(isValidSku("X".repeat(65))).toBe(false);
  });
});
