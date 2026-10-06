import { describe, expect, it } from "vitest";
import { isLand, type LandGrid } from "@/domain/map/land";
import { MAP } from "@/domain/map/project";
import { REGIONS, REGION_HUB, regionOf } from "@/domain/map/regions";
import { makeRoute, routePoint } from "@/domain/map/route";
import { US_STATES } from "@/domain/map/usStates";
import { DEFAULT_RULES } from "@/domain/org/settings";
import { DAY } from "@/domain/time";
import us from "@/public/map/us.json";
import { STATE_SHARES, demoShipments, demoWarehouse } from "./fixtures";
import { truckSummary } from "./loadText";
import { buildMapModel, shipmentsAsOf } from "./model";

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

  it("draws every truck stop and region ring on land", () => {
    const grid = us.grid as LandGrid;
    for (const s of US_STATES) expect(isLand(grid, s), s.code).toBe(true);
    for (const r of REGIONS) expect(isLand(grid, REGION_HUB[r]), r).toBe(true);
  });

  it("bends roads so they cross less water than straight ones (the Great Lakes can't be avoided)", () => {
    const grid = us.grid as LandGrid;
    const wet = (bend: number) =>
      US_STATES.reduce((n, s) => {
        const route = makeRoute(demoWarehouse, s, bend);
        for (let i = 1; i < 40; i++) {
          const p = routePoint(route, i / 40);
          if (!isLand(grid, { lat: -p.z, lng: p.x })) n++;
        }
        return n;
      }, 0);
    expect(wet(MAP.routeBend)).toBeLessThan(wet(0) * 0.6);
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

describe("buildMapModel regions", () => {
  it("tags every truck, road and pin with its state's Census region", () => {
    for (const t of model.trucks) expect(regionOf(t.state)).toBe(t.region);
    for (const r of model.roads) expect(regionOf(r.state)).toBe(r.region);
    for (const p of model.pins) expect(regionOf(p.state)).toBe(p.region);
  });

  it("sums every open order into exactly one region", () => {
    const open = model.trucks.reduce((n, t) => n + t.open, 0);
    expect(REGIONS.reduce((n, r) => n + model.regions[r].open, 0)).toBe(open);
  });

  it("lists the Denver truck first among the West's problems", () => {
    const first = model.regions.west.problems[0];
    expect(first).toMatchObject({ state: "CO", status: "late" });
  });

  it("parks each region's loading trucks from the dock's first slot", () => {
    for (const r of REGIONS) {
      const loading = model.trucks.filter((t) => t.loading && t.region === r);
      expect(model.yards[r].trucks).toBe(loading.length);
      const xs = loading.map((t) => t.position.x);
      if (xs.length) expect(Math.min(...xs)).toBeCloseTo(demoWarehouse.lng + 3.4, 6);
    }
  });
});

describe("replaying the week", () => {
  const DISPATCH = Date.UTC(2026, 9, 2, 19); // a daily 19:00 UTC dispatch
  const at = (t: number) => buildMapModel(shipmentsAsOf(shipments, t), demoWarehouse, DEFAULT_RULES, t);

  it("is the live map at the live moment", () => {
    expect(at(NOW)).toEqual(model);
  });

  it("drops orders placed later and scans not seen yet", () => {
    const then = NOW - 3 * DAY;
    const asOf = shipmentsAsOf(shipments, then);
    expect(asOf.length).toBeLessThan(shipments.length);
    for (const s of asOf) {
      expect(s.timing.placedAt).toBeLessThanOrEqual(then);
      for (const e of s.events) expect(e.at).toBeLessThanOrEqual(then);
    }
  });

  it("sends the day's loads out of the dock at dispatch and moves them on", () => {
    const before = at(DISPATCH - 1);
    const after = at(DISPATCH + 1);
    const later = at(DISPATCH + 12 * 60 * 60_000);
    const leaving = after.trucks.filter((t) => !t.loading && t.departedAt === DISPATCH);
    expect(leaving.length).toBeGreaterThan(20);
    expect(before.trucks.filter((t) => t.loading).length).toBeGreaterThan(after.trucks.filter((t) => t.loading).length);
    for (const t of leaving) {
      const next = later.trucks.find((x) => x.key === t.key);
      if (next) expect(next.progress).toBeGreaterThan(t.progress);
    }
  });
});
