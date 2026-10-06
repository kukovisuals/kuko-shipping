import { describe, expect, it } from "vitest";
import { isLand, type LandGrid } from "@/domain/map/land";
import { US_STATES } from "@/domain/map/usStates";
import { DEFAULT_RULES } from "@/domain/org/settings";
import { DAY } from "@/domain/time";
import us from "@/public/map/us.json";
import { STATE_SHARES, demoShipments, demoWarehouse } from "./fixtures";
import { truckSummary } from "./loadText";
import { buildMapModel } from "./model";

const NOW = Date.UTC(2026, 9, 6, 15); // any fixed time: fixtures are relative to it
const shipments = demoShipments(NOW);
const model = buildMapModel(shipments, demoWarehouse, DEFAULT_RULES, NOW);
const trucksTo = (state: string) => model.trucks.filter((t) => t.state === state);
const orders = model.trucks.flatMap((t) => t.orders);

describe("demo orders", () => {
  it("are about 300 a day, all to the lower 48, the same every time", () => {
    const lastWeek = shipments.filter((s) => s.timing.placedAt > NOW - 7 * DAY);
    expect(lastWeek.length / 7).toBeGreaterThan(270);
    expect(lastWeek.length / 7).toBeLessThan(340);
    expect(demoShipments(NOW)).toEqual(shipments);
  });

  it("send about half to NY, FL, CA and TX", () => {
    const share = (c: string) => shipments.filter((s) => s.state === c).length / shipments.length;
    expect(share("NY") + share("FL") + share("CA") + share("TX")).toBeCloseTo(0.5, 1);
    expect(STATE_SHARES.reduce((s, [, w]) => s + w, 0)).toBeCloseTo(1, 10);
  });

  it("never carry a street, name or email — city level only", () => {
    for (const key of Object.keys(shipments[0])) expect(key).not.toMatch(/name|email|phone|street|address/i);
  });
});

describe("buildMapModel trucks", () => {
  it("puts one state's orders from one ship day on one truck", () => {
    const keys = model.trucks.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of model.trucks) expect(t.orders.every((o) => o.state === t.state)).toBe(true);
    // A big state has a truck for each day it is still on the road, plus one loading.
    expect(trucksTo("CA").length).toBeGreaterThanOrEqual(3);
    expect(trucksTo("CA").filter((t) => t.loading)).toHaveLength(1);
  });

  it("keeps most trucks on time: delays come by truck, not sprinkled on every load", () => {
    const late = model.trucks.filter((t) => t.status === "late").length;
    const risky = model.trucks.filter((t) => t.status === "at_risk").length;
    expect(late).toBeGreaterThan(0);
    expect(late + risky).toBeLessThan(model.trucks.length * 0.25);
  });

  it("parks loading trucks in the yard and drives the rest along their road", () => {
    for (const t of model.trucks) {
      if (t.loading) expect(t.progress).toBe(0);
      else expect(t.progress).toBeGreaterThan(0);
    }
    expect(model.roads.length).toBeGreaterThan(20);
  });

  it("draws every truck stop on land", () => {
    const grid = us.grid as LandGrid;
    for (const s of US_STATES) expect(isLand(grid, s), s.code).toBe(true);
  });
});

describe("the §3a delay stories", () => {
  it("1. Texas: a carrier exception makes its truck at risk", () => {
    const o = orders.find((x) => x.state === "TX" && x.delay.reason === "carrier exception");
    expect(o?.delay.status).toBe("at_risk");
    expect(trucksTo("TX").find((t) => t.orders.includes(o!))?.status).toBe("at_risk");
  });

  it("2. Denver: four UPS shipments 3 days late, so the truck is late and parked at 0.95", () => {
    const denver = orders.filter((o) => o.state === "CO" && o.events.some((e) => e.place === "Denver hub"));
    expect(denver).toHaveLength(4);
    for (const o of denver) expect(o.delay).toMatchObject({ status: "late", daysLate: 3 });
    const truck = trucksTo("CO").find((t) => t.orders.includes(denver[0]))!;
    expect(truck).toMatchObject({ status: "late", progress: 0.95 });
    expect(truckSummary(truck)).toMatch(/^4 of \d+ late/);
  });

  it("3. Chicago: no scan for 52 h → at risk", () => {
    expect(orders.some((o) => o.state === "IL" && o.delay.reason === "no scan for 52 h")).toBe(true);
  });

  it("4. Nashville: not shipped after 3 days, so the loading truck is at risk", () => {
    const tn = trucksTo("TN").find((t) => t.loading)!;
    expect(tn.status).toBe("at_risk");
    expect(tn.orders[0].delay.reason).toBe("not shipped yet");
  });

  it("5. Seattle: two orders delivered 1 and 2 days late", () => {
    const wa = shipments
      .filter((s) => s.state === "WA" && s.timing.deliveredAt === NOW - DAY && s.events.length === 3)
      .map((s) => buildMapModel([s], demoWarehouse, DEFAULT_RULES, NOW).counts.delivered_late);
    expect(wa).toEqual([1, 1]);
  });

  it("counts open orders and recent deliveries by status", () => {
    expect(model.counts.late).toBeGreaterThanOrEqual(4);
    expect(model.counts.delivered_late).toBeGreaterThanOrEqual(2);
    expect(model.pins.find((p) => p.state === "NY")!.count).toBeGreaterThan(100);
  });

  it("shows the out-of-stock ring", () => {
    expect(demoWarehouse.flag).toBe("out");
  });
});

describe("buildMapModel draw cap", () => {
  it("past the cap draws only late and at-risk trucks and counts the rest", () => {
    const capped = buildMapModel(shipments, demoWarehouse, DEFAULT_RULES, NOW, 10);
    expect(capped.trucks.every((t) => t.status === "late" || t.status === "at_risk")).toBe(true);
    expect(capped.hiddenCount).toBe(model.trucks.length - capped.trucks.length);
  });
});
