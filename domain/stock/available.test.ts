import { describe, expect, it } from "vitest";
import { available, reservedByStock } from "./available";
import { stockKey } from "./ledger";

describe("reservedByStock", () => {
  it("sums open order lines per variant per warehouse", () => {
    const reserved = reservedByStock([
      { variantId: "v1", warehouseId: "W01", qty: 2 },
      { variantId: "v1", warehouseId: "W01", qty: 1 },
      { variantId: "v1", warehouseId: "W02", qty: 4 },
      { variantId: "v2", warehouseId: "W01", qty: 1 },
    ]);
    expect(reserved.get(stockKey("v1", "W01"))).toBe(3);
    expect(reserved.get(stockKey("v1", "W02"))).toBe(4);
    expect(reserved.get(stockKey("v2", "W01"))).toBe(1);
    expect(reserved.get(stockKey("v3", "W01"))).toBeUndefined();
  });
});

describe("available", () => {
  it("is on hand minus reserved", () => {
    expect(available(40, 3)).toBe(37);
    expect(available(5, 5)).toBe(0);
  });

  it("goes negative when more is promised than on hand", () => {
    expect(available(0, 2)).toBe(-2);
  });
});
