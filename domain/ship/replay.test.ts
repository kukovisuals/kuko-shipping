import { describe, expect, it } from "vitest";
import type { ShipmentEvent, ShipmentTiming } from "@/domain/ship/types";
import { DAY, HOUR } from "@/domain/time";
import {
  REPLAY_RATE,
  REPLAY_TICK,
  isLive,
  liveReplay,
  playReplay,
  replayFrame,
  seekReplay,
  stepReplay,
  timingAsOf,
} from "./replay";

const NOW = Date.UTC(2026, 9, 6, 14, 37);

describe("replay clock", () => {
  it("starts live, a week of history behind it", () => {
    const r = liveReplay(NOW);
    expect(r.from).toBe(NOW - 7 * DAY);
    expect(isLive(r)).toBe(true);
    expect(replayFrame(r)).toBe(NOW);
  });

  it("plays from the start of the week when it sits at the live moment", () => {
    const r = playReplay(liveReplay(NOW));
    expect(r.at).toBe(r.from);
    expect(r.playing).toBe(true);
    expect(isLive(r)).toBe(false);
  });

  it("steps simulated time by real seconds × rate × speed", () => {
    const r = playReplay(liveReplay(NOW));
    expect(stepReplay(r, 1).at).toBe(r.from + REPLAY_RATE);
    expect(stepReplay({ ...r, speed: 4 }, 0.5).at).toBe(r.from + 2 * REPLAY_RATE);
  });

  it("does not move while paused", () => {
    const r = seekReplay(liveReplay(NOW), NOW - 3 * DAY);
    expect(stepReplay(r, 10)).toBe(r);
  });

  it("stops at the live moment and goes live", () => {
    const r = stepReplay({ ...playReplay(liveReplay(NOW)), at: NOW - HOUR }, 60);
    expect(r.at).toBe(NOW);
    expect(r.playing).toBe(false);
    expect(isLive(r)).toBe(true);
  });

  it("a week plays in 28 s at 1×", () => {
    let r = playReplay(liveReplay(NOW));
    for (let i = 0; i < 27 * 60; i++) r = stepReplay(r, 1 / 60);
    expect(r.playing).toBe(true);
    for (let i = 0; i < 61; i++) r = stepReplay(r, 1 / 60);
    expect(r.playing).toBe(false);
  });

  it("seeks inside the week only", () => {
    const r = liveReplay(NOW);
    expect(seekReplay(r, NOW - 30 * DAY).at).toBe(r.from);
    expect(seekReplay(r, NOW + DAY).at).toBe(NOW);
  });

  it("draws whole ticks, so the map is not rebuilt every frame", () => {
    const r = seekReplay(liveReplay(NOW), NOW - 3 * DAY + REPLAY_TICK * 2.6);
    expect(replayFrame(r)).toBe(NOW - 3 * DAY + REPLAY_TICK * 2);
  });
});

describe("timingAsOf", () => {
  const PLACED = Date.UTC(2026, 9, 1, 12);
  const SHIPPED = Date.UTC(2026, 9, 2, 19);
  const DELIVERED = Date.UTC(2026, 9, 4, 20);
  const ev = (status: ShipmentEvent["status"], at: number, etaAt: number | null = null): ShipmentEvent => ({
    at,
    status,
    lat: null,
    lng: null,
    place: null,
    note: null,
    etaAt,
  });
  // Arrived out of order: the delivery scan came in before the hub scan.
  const events = [ev("label_created", PLACED + HOUR), ev("in_transit", SHIPPED, DELIVERED), ev("delivered", DELIVERED), ev("in_transit", SHIPPED + DAY)];
  const timing: ShipmentTiming = {
    status: "delivered",
    placedAt: PLACED,
    promisedAt: null,
    shippedAt: SHIPPED,
    deliveredAt: DELIVERED,
    lastEventAt: DELIVERED,
    carrierEtaAt: null,
  };

  it("is null before the order was placed", () => {
    expect(timingAsOf({ timing, events }, PLACED - 1)).toBeNull();
  });

  it("is waiting at the warehouse before the truck leaves", () => {
    const t = timingAsOf({ timing, events }, PLACED + 2 * HOUR)!;
    expect(t).toMatchObject({ status: "label_created", shippedAt: null, deliveredAt: null, lastEventAt: PLACED + HOUR });
  });

  it("is on the road with the carrier ETA known by then", () => {
    const t = timingAsOf({ timing, events }, SHIPPED + 30 * HOUR)!;
    expect(t).toMatchObject({ status: "in_transit", shippedAt: SHIPPED, deliveredAt: null, lastEventAt: SHIPPED + DAY, carrierEtaAt: DELIVERED });
  });

  it("is delivered from the delivery scan on", () => {
    expect(timingAsOf({ timing, events }, DELIVERED)).toEqual(timing);
  });
});
