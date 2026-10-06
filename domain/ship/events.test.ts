import { describe, expect, it } from "vitest";
import { DAY, HOUR } from "@/domain/time";
import { latestEvent, sortEvents, summarizeEvents } from "./events";
import type { ShipmentEvent } from "./types";

const T0 = Date.UTC(2026, 8, 2, 12);

function ev(status: ShipmentEvent["status"], at: number, over: Partial<ShipmentEvent> = {}): ShipmentEvent {
  return { at, status, lat: null, lng: null, place: null, note: null, etaAt: null, ...over };
}

describe("sortEvents / latestEvent", () => {
  it("orders by `at`, not by arrival", () => {
    const arrived = [ev("out_for_delivery", T0 + 2 * DAY), ev("label_created", T0), ev("in_transit", T0 + DAY)];
    expect(sortEvents(arrived).map((e) => e.status)).toEqual(["label_created", "in_transit", "out_for_delivery"]);
    expect(latestEvent(arrived)?.status).toBe("out_for_delivery");
  });

  it("returns null for no events and does not change the input", () => {
    expect(latestEvent([])).toBeNull();
    const input = [ev("in_transit", T0 + DAY), ev("label_created", T0)];
    sortEvents(input);
    expect(input[0].status).toBe("in_transit");
  });
});

describe("summarizeEvents", () => {
  it("follows the latest `at` even when an older event arrives last", () => {
    const s = summarizeEvents([ev("label_created", T0), ev("out_for_delivery", T0 + 2 * DAY), ev("in_transit", T0 + DAY)]);
    expect(s.status).toBe("out_for_delivery");
    expect(s.lastEventAt).toBe(T0 + 2 * DAY);
  });

  it("sets deliveredAt from the delivery scan", () => {
    const s = summarizeEvents([ev("in_transit", T0), ev("delivered", T0 + 3 * DAY)]);
    expect(s).toMatchObject({ status: "delivered", deliveredAt: T0 + 3 * DAY });
    expect(summarizeEvents([ev("in_transit", T0)]).deliveredAt).toBeNull();
  });

  it("keeps the ETA from the latest event that carries one", () => {
    const s = summarizeEvents([
      ev("in_transit", T0, { etaAt: T0 + 4 * DAY }),
      ev("in_transit", T0 + DAY, { etaAt: T0 + 5 * DAY }),
      ev("in_transit", T0 + 2 * DAY),
    ]);
    expect(s.carrierEtaAt).toBe(T0 + 5 * DAY);
    expect(summarizeEvents([ev("in_transit", T0)]).carrierEtaAt).toBeNull();
  });

  it("has a position only when the latest event has lat/lng", () => {
    const hub = ev("in_transit", T0 + DAY, { lat: 41.88, lng: -87.63, place: "Chicago hub" });
    expect(summarizeEvents([ev("label_created", T0), hub]).position).toEqual({ lat: 41.88, lng: -87.63 });
    expect(summarizeEvents([hub, ev("in_transit", T0 + DAY + HOUR)]).position).toBeNull();
  });

  it("is empty for no events", () => {
    expect(summarizeEvents([])).toEqual({
      status: null,
      lastEventAt: null,
      deliveredAt: null,
      carrierEtaAt: null,
      position: null,
    });
  });
});
