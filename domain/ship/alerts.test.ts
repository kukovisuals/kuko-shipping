import { describe, expect, it } from "vitest";
import { DAY, HOUR } from "@/domain/time";
import { ackHides, buildAlerts, type AlertCandidate } from "./alerts";
import type { Delay } from "./delay";

const PROMISED = Date.UTC(2026, 8, 8);

function candidate(id: string, delay: Partial<Delay>, over: Partial<AlertCandidate> = {}): AlertCandidate {
  return {
    id,
    placedAt: Date.UTC(2026, 8, 1),
    lastEventAt: null,
    ackAt: null,
    delay: { status: "on_time", promisedAt: PROMISED, daysLate: 0, remainingMs: null, reason: "", ...delay },
    ...over,
  };
}

describe("buildAlerts", () => {
  it("keeps only late and at-risk shipments", () => {
    const list = buildAlerts([
      candidate("a", { status: "on_time" }),
      candidate("b", { status: "delivered_late", daysLate: 2 }),
      candidate("c", { status: "at_risk" }),
      candidate("d", { status: "late", daysLate: 1 }),
    ]);
    expect(list.map((c) => c.id)).toEqual(["d", "c"]);
  });

  it("sorts late by days late (most first), then at-risk, then by order date", () => {
    const list = buildAlerts([
      candidate("risk-new", { status: "at_risk" }, { placedAt: Date.UTC(2026, 8, 5) }),
      candidate("late-1", { status: "late", daysLate: 1 }),
      candidate("risk-old", { status: "at_risk" }, { placedAt: Date.UTC(2026, 8, 2) }),
      candidate("late-3", { status: "late", daysLate: 3 }),
      candidate("late-3-older", { status: "late", daysLate: 3 }, { placedAt: Date.UTC(2026, 7, 30) }),
    ]);
    expect(list.map((c) => c.id)).toEqual(["late-3-older", "late-3", "late-1", "risk-old", "risk-new"]);
  });

  it("does not change its input", () => {
    const input = [candidate("b", { status: "at_risk" }), candidate("a", { status: "late", daysLate: 1 })];
    buildAlerts(input);
    expect(input.map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("ackHides", () => {
  const ackAt = PROMISED + 2 * HOUR; // acked while 1 day late

  it("hides an acked alert", () => {
    expect(ackHides(candidate("a", { status: "late", daysLate: 1 }, { ackAt }))).toBe(true);
  });

  it("shows it again when a newer event arrives", () => {
    const c = candidate("a", { status: "late", daysLate: 1 }, { ackAt, lastEventAt: ackAt + HOUR });
    expect(ackHides(c)).toBe(false);
  });

  it("keeps it hidden for an event older than the ack", () => {
    const c = candidate("a", { status: "late", daysLate: 1 }, { ackAt, lastEventAt: ackAt - HOUR });
    expect(ackHides(c)).toBe(true);
  });

  it("shows it again when the shipment gets one day later", () => {
    expect(ackHides(candidate("a", { status: "late", daysLate: 2 }, { ackAt }))).toBe(false);
  });

  it("an at-risk ack lasts until the shipment turns late", () => {
    const riskAck = PROMISED - 5 * HOUR;
    expect(ackHides(candidate("a", { status: "at_risk", daysLate: 0 }, { ackAt: riskAck }))).toBe(true);
    expect(ackHides(candidate("a", { status: "late", daysLate: 1 }, { ackAt: riskAck }))).toBe(false);
  });

  it("never hides an alert with no ack", () => {
    expect(ackHides(candidate("a", { status: "late", daysLate: 5 }))).toBe(false);
    expect(buildAlerts([candidate("a", { status: "late", daysLate: 1 }, { ackAt: PROMISED + DAY / 2 })])).toEqual([]);
  });
});
