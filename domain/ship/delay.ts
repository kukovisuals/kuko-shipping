import type { OrgRules } from "@/domain/org/settings";
import type { DelayStatus } from "@/domain/ship/status";
import type { ShipmentTiming } from "@/domain/ship/types";
import { DAY, HOUR, type Ms } from "@/domain/time";

export type Delay = {
  status: DelayStatus;
  promisedAt: Ms;
  daysLate: number;
  /** carrier ETA − now; null when the carrier gave no ETA or it is delivered. Never invented. */
  remainingMs: Ms | null;
  reason: string;
};

export function promisedAt(t: Pick<ShipmentTiming, "placedAt" | "promisedAt">, rules: Pick<OrgRules, "slaDays">): Ms {
  return t.promisedAt ?? t.placedAt + rules.slaDays * DAY;
}

/** Whole days past the promise, rounded up; 0 when not past it. */
export function daysLate(promised: Ms, ref: Ms): number {
  return Math.max(0, Math.ceil((ref - promised) / DAY));
}

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

// TODO(owner): a `returned` shipment follows the not-delivered rules, so it ends up late.
export function assessDelay(t: ShipmentTiming, rules: OrgRules, now: Ms): Delay {
  const promised = promisedAt(t, rules);
  const result = (status: DelayStatus, reason: string, ref: Ms = now): Delay => ({
    status,
    promisedAt: promised,
    daysLate: status === "late" || status === "delivered_late" ? daysLate(promised, ref) : 0,
    remainingMs: t.deliveredAt === null && t.carrierEtaAt !== null ? t.carrierEtaAt - now : null,
    reason,
  });

  if (t.deliveredAt !== null) {
    return t.deliveredAt <= promised
      ? result("on_time", "delivered on time")
      : result("delivered_late", `delivered ${days(daysLate(promised, t.deliveredAt))} late`, t.deliveredAt);
  }
  if (now > promised) return result("late", `${days(daysLate(promised, now))} past promise`);
  if (t.status === "exception") return result("at_risk", "carrier exception");
  if (now > promised - rules.riskWindowHours * HOUR) {
    const hours = Math.ceil((promised - now) / HOUR);
    return result("at_risk", hours > 0 ? `due in ${hours} h` : "due now");
  }
  if (t.shippedAt !== null) {
    const lastScan = t.lastEventAt ?? t.shippedAt;
    if (now - lastScan > rules.stallHours * HOUR) {
      return result("at_risk", `no scan for ${Math.floor((now - lastScan) / HOUR)} h`);
    }
  } else if (now - t.placedAt > rules.handlingDays * DAY) {
    return result("at_risk", "not shipped yet");
  }
  return result("on_time", "on track");
}
