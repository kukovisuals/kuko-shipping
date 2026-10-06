import { describe, expect, it } from "vitest";
import { applyDelta, movementError, replayLedger, stockKey } from "./ledger";
import type { Movement } from "./types";

const m = (delta: number, reason: Movement["reason"], ref: string | null = null, variantId = "v1"): Movement => ({
  variantId,
  warehouseId: "W01",
  delta,
  reason,
  ref,
});

describe("movementError", () => {
  it("accepts well-formed movements", () => {
    expect(movementError(m(50, "received", "PO-1"))).toBeNull();
    expect(movementError(m(-2, "shipped", "ship-1"))).toBeNull();
    expect(movementError(m(1, "returned"))).toBeNull();
    expect(movementError(m(-3, "adjusted"))).toBeNull();
    expect(movementError(m(4, "counted"))).toBeNull();
  });

  it("refuses zero and fractional quantities", () => {
    expect(movementError(m(0, "adjusted"))).toMatch(/not 0/);
    expect(movementError(m(1.5, "received"))).toMatch(/whole number/);
  });

  it("checks the sign against the reason", () => {
    expect(movementError(m(-5, "received"))).toMatch(/adds stock/);
    expect(movementError(m(-1, "returned"))).toMatch(/adds stock/);
    expect(movementError(m(2, "shipped", "ship-1"))).toMatch(/takes stock/);
  });

  it("needs a shipment id on shipped movements and caps the ref length", () => {
    expect(movementError(m(-1, "shipped"))).toMatch(/shipment id/);
    expect(movementError(m(1, "received", "x".repeat(201)))).toMatch(/longer than 200/);
  });

  it("refuses an unknown reason", () => {
    expect(movementError({ delta: 1, reason: "stolen" as Movement["reason"], ref: null })).toBe("Unknown reason");
  });
});

describe("applyDelta", () => {
  it("adds and subtracts", () => {
    expect(applyDelta(10, 5)).toEqual({ ok: true, onHand: 15 });
    expect(applyDelta(10, -10)).toEqual({ ok: true, onHand: 0 });
  });

  it("never goes below zero", () => {
    expect(applyDelta(3, -4)).toEqual({ ok: false });
    expect(applyDelta(0, -1)).toEqual({ ok: false });
  });
});

describe("replayLedger", () => {
  it("sums movements per variant per warehouse", () => {
    const { onHand } = replayLedger([m(100, "received"), m(-3, "shipped", "s1"), m(40, "received", null, "v2")]);
    expect(onHand.get(stockKey("v1", "W01"))).toBe(97);
    expect(onHand.get(stockKey("v2", "W01"))).toBe(40);
  });

  it("refuses a movement that would go below zero and keeps going", () => {
    const r = replayLedger([m(2, "received"), m(-5, "shipped", "s1"), m(-2, "shipped", "s2")]);
    expect(r.refused.map((x) => x.ref)).toEqual(["s1"]);
    expect(r.onHand.get(stockKey("v1", "W01"))).toBe(0);
  });

  it("lets a shipment take stock only once", () => {
    const r = replayLedger([m(10, "received"), m(-2, "shipped", "s1"), m(-2, "shipped", "s1")]);
    expect(r.duplicates).toHaveLength(1);
    expect(r.onHand.get(stockKey("v1", "W01"))).toBe(8);
  });

  it("lets a refused shipment try again once stock arrives", () => {
    const r = replayLedger([m(-2, "shipped", "s1"), m(5, "received"), m(-2, "shipped", "s1")]);
    expect(r.refused).toHaveLength(1);
    expect(r.duplicates).toHaveLength(0);
    expect(r.onHand.get(stockKey("v1", "W01"))).toBe(3);
  });
});
