import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/domain/org/settings";
import { DAY, HOUR, localDate, parseIso } from "@/domain/time";
import { assessDelay, daysLate, promisedAt } from "./delay";
import type { ShipmentTiming } from "./types";

const PLACED = Date.UTC(2026, 8, 1); // 1 Sep 2026 00:00Z
const PROMISED = PLACED + 7 * DAY;

/** Shipped a day after the order, scanned recently: on time unless a test says otherwise. */
function timing(over: Partial<ShipmentTiming> = {}): ShipmentTiming {
  return {
    status: "in_transit",
    placedAt: PLACED,
    promisedAt: null,
    shippedAt: PLACED + DAY,
    deliveredAt: null,
    lastEventAt: PLACED + 2 * DAY,
    carrierEtaAt: null,
    ...over,
  };
}
const at = (t: ShipmentTiming, now: number) => assessDelay(t, DEFAULT_RULES, now);

describe("promisedAt", () => {
  it("is placed + SLA days when the order has no promise of its own", () => {
    expect(promisedAt(timing(), DEFAULT_RULES)).toBe(PROMISED);
  });

  it("uses the order's own promise when set (international + 14 days)", () => {
    expect(promisedAt(timing({ promisedAt: PLACED + 14 * DAY }), DEFAULT_RULES)).toBe(PLACED + 14 * DAY);
  });
});

describe("daysLate", () => {
  it("rounds up whole days and is 0 when not late", () => {
    expect(daysLate(PROMISED, PROMISED)).toBe(0);
    expect(daysLate(PROMISED, PROMISED - DAY)).toBe(0);
    expect(daysLate(PROMISED, PROMISED + 1)).toBe(1);
    expect(daysLate(PROMISED, PROMISED + DAY)).toBe(1);
    expect(daysLate(PROMISED, PROMISED + DAY + 1)).toBe(2);
  });
});

describe("assessDelay — delivered", () => {
  it("is on_time when delivered on or before the promise", () => {
    const d = at(timing({ status: "delivered", deliveredAt: PROMISED }), PROMISED + 5 * DAY);
    expect(d).toMatchObject({ status: "on_time", daysLate: 0, remainingMs: null, reason: "delivered on time" });
  });

  it("is delivered_late after the promise, counting days from the delivery, not now", () => {
    const one = at(timing({ status: "delivered", deliveredAt: PROMISED + HOUR }), PROMISED + 10 * DAY);
    expect(one).toMatchObject({ status: "delivered_late", daysLate: 1, reason: "delivered 1 day late" });
    const two = at(timing({ status: "delivered", deliveredAt: PROMISED + 1.5 * DAY }), PROMISED + 10 * DAY);
    expect(two).toMatchObject({ status: "delivered_late", daysLate: 2, reason: "delivered 2 days late" });
  });
});

describe("assessDelay — not delivered, in rule order", () => {
  it("1. late once now is past the promise", () => {
    expect(at(timing(), PROMISED + 3 * DAY)).toMatchObject({ status: "late", daysLate: 3, reason: "3 days past promise" });
    expect(at(timing(), PROMISED + HOUR)).toMatchObject({ status: "late", daysLate: 1, reason: "1 day past promise" });
  });

  it("1 beats 2: an exception past the promise is late", () => {
    expect(at(timing({ status: "exception" }), PROMISED + DAY).status).toBe("late");
  });

  it("2. at_risk on a carrier exception before the promise", () => {
    expect(at(timing({ status: "exception" }), PLACED + 3 * DAY)).toMatchObject({
      status: "at_risk",
      daysLate: 0,
      reason: "carrier exception",
    });
  });

  it("3. at_risk inside the risk window", () => {
    expect(at(timing({ lastEventAt: PROMISED - 6 * HOUR }), PROMISED - 5 * HOUR)).toMatchObject({
      status: "at_risk",
      reason: "due in 5 h",
    });
    expect(at(timing({ lastEventAt: PROMISED - HOUR }), PROMISED).reason).toBe("due now");
  });

  it("3 is not triggered just outside the window", () => {
    expect(at(timing({ lastEventAt: PROMISED - 26 * HOUR }), PROMISED - 25 * HOUR).status).toBe("on_time");
  });

  it("3 beats 4: inside the window and stalled reads as due", () => {
    expect(at(timing({ lastEventAt: PLACED + DAY }), PROMISED - 2 * HOUR).reason).toBe("due in 2 h");
  });

  it("4. at_risk when shipped and no scan for more than stall hours", () => {
    const last = PLACED + 2 * DAY;
    expect(at(timing({ lastEventAt: last }), last + 52 * HOUR)).toMatchObject({
      status: "at_risk",
      reason: "no scan for 52 h",
    });
    expect(at(timing({ lastEventAt: last }), last + 48 * HOUR).status).toBe("on_time");
  });

  it("4 falls back to shipped_at when there is no scan yet", () => {
    const shipped = PLACED + DAY;
    expect(at(timing({ shippedAt: shipped, lastEventAt: null }), shipped + 49 * HOUR).reason).toBe("no scan for 49 h");
  });

  it("5. at_risk when not shipped after the handling days", () => {
    const unshipped = timing({ status: "label_created", shippedAt: null, lastEventAt: null });
    expect(at(unshipped, PLACED + 3 * DAY)).toMatchObject({ status: "at_risk", reason: "not shipped yet" });
    expect(at(unshipped, PLACED + 2 * DAY).status).toBe("on_time");
  });

  it("6. otherwise on_time", () => {
    expect(at(timing(), PLACED + 3 * DAY)).toMatchObject({ status: "on_time", daysLate: 0, reason: "on track" });
  });
});

describe("assessDelay — remaining time", () => {
  it("is carrier ETA − now when the carrier gave an ETA", () => {
    const now = PLACED + 3 * DAY;
    expect(at(timing({ carrierEtaAt: now + 30 * HOUR }), now).remainingMs).toBe(30 * HOUR);
  });

  it("is null with no carrier ETA — never invented", () => {
    expect(at(timing({ carrierEtaAt: null }), PLACED + 3 * DAY).remainingMs).toBeNull();
    expect(at(timing({ carrierEtaAt: null }), PROMISED + 2 * DAY).remainingMs).toBeNull();
  });

  it("is null once delivered", () => {
    const t = timing({ status: "delivered", deliveredAt: PLACED + 4 * DAY, carrierEtaAt: PLACED + 5 * DAY });
    expect(at(t, PLACED + 4 * DAY).remainingMs).toBeNull();
  });
});

describe("assessDelay — an order placed at 23:30 New York time", () => {
  const placed = parseIso("2026-09-28T23:30:00-04:00"); // 03:30Z on the 29th
  const t = timing({ placedAt: placed, shippedAt: placed + DAY, lastEventAt: placed + 6 * DAY });

  it("promises exactly 7 × 24 h later, counted in UTC", () => {
    expect(assessDelay(t, DEFAULT_RULES, placed).promisedAt).toBe(parseIso("2026-10-06T03:30:00Z"));
    expect(localDate(placed, "America/New_York")).toBe("2026-09-28");
  });

  it("turns late 1 ms after the promise, not at a local midnight", () => {
    const promised = parseIso("2026-10-06T03:30:00Z");
    expect(assessDelay(t, DEFAULT_RULES, promised).status).toBe("at_risk");
    expect(assessDelay(t, DEFAULT_RULES, promised + 1)).toMatchObject({ status: "late", daysLate: 1 });
  });
});
