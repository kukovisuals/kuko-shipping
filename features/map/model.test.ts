import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/domain/org/settings";
import { demoShipments, demoWarehouse } from "./fixtures";
import { buildMapModel } from "./model";

const NOW = Date.UTC(2026, 9, 5, 15); // any fixed time: fixtures are relative to it
const model = buildMapModel(demoShipments(NOW), demoWarehouse, DEFAULT_RULES, NOW);
const byOrder = (n: string) => model.drones.find((d) => d.orderNumber === n);

describe("buildMapModel with the demo stories", () => {
  it("counts each delay status", () => {
    expect(model.counts).toEqual({ late: 5, at_risk: 4, on_time: 12, delivered_late: 2 });
  });

  it("tells each §3a story", () => {
    expect(byOrder("DW-100412")?.delay).toMatchObject({ status: "at_risk", reason: "carrier exception" });
    const denver = model.drones.filter((d) => d.city === "Denver, CO");
    expect(denver).toHaveLength(4);
    for (const d of denver) expect(d.delay).toMatchObject({ status: "late", daysLate: 3 });
    expect(byOrder("DW-100455")?.delay.reason).toBe("no scan for 52 h");
    expect(byOrder("DW-100470")?.delay.reason).toBe("not shipped yet");
  });

  it("draws only open shipments as drones", () => {
    expect(model.drones.every((d) => !d.delivered)).toBe(true);
    expect(model.drones).toHaveLength(23 - 3);
    expect(model.hiddenCount).toBe(0);
  });

  it("uses a real position only when the latest scan has one", () => {
    expect(byOrder("DW-100412")?.position.estimated).toBe(false); // Sydney customs
    expect(byOrder("DW-100485")?.position.estimated).toBe(false); // Dallas hub
    expect(byOrder("DW-100488")?.position.estimated).toBe(true);
  });

  it("keeps unshipped drones at the warehouse", () => {
    const p = byOrder("DW-100470")?.position;
    expect(p).toMatchObject({ x: demoWarehouse.lng, z: -demoWarehouse.lat, t: 0 });
  });

  it("merges New York's three orders into one pin and keeps recent delivery pins", () => {
    expect(model.pins.find((p) => p.count === 3)?.items.every((i) => i.id.startsWith("fx-1004"))).toBe(true);
    const london = model.pins.find((p) => Math.abs(p.lat - 51.5) < 1);
    expect(london?.count).toBe(2);
  });

  it("shows the out-of-stock ring", () => {
    expect(demoWarehouse.flag).toBe("out");
  });
});

describe("buildMapModel draw cap", () => {
  it("past the cap draws only late and at-risk drones and counts the rest", () => {
    const capped = buildMapModel(demoShipments(NOW), demoWarehouse, DEFAULT_RULES, NOW, 10);
    expect(capped.drones.every((d) => d.delay.status === "late" || d.delay.status === "at_risk")).toBe(true);
    expect(capped.drones).toHaveLength(9);
    expect(capped.hiddenCount).toBe(20 - 9);
  });
});
