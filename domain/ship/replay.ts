import { summarizeEvents } from "@/domain/ship/events";
import type { ShipmentEvent, ShipmentTiming } from "@/domain/ship/types";
import { DAY, HOUR, type Ms } from "@/domain/time";

// Replay: the map as it stood at any moment of the last week. The clock is a pure step(); the
// map is rebuilt from what was known at that moment (orders placed, events scanned by then).

export const REPLAY_DAYS = 7;
/** Simulated time per real second at 1×: a day every 4 s, a week in 28 s. */
export const REPLAY_RATE: Ms = 6 * HOUR;
export const REPLAY_SPEEDS = [1, 2, 4] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];
/** The map is rebuilt once per this much simulated time, not every frame. */
export const REPLAY_TICK: Ms = 10 * 60_000;

export type Replay = {
  from: Ms;
  /** The live moment: the replay ends here. */
  to: Ms;
  at: Ms;
  playing: boolean;
  speed: ReplaySpeed;
};

/** Live: parked at `now`, not playing. */
export function liveReplay(now: Ms, days: number = REPLAY_DAYS): Replay {
  return { from: now - days * DAY, to: now, at: now, playing: false, speed: 1 };
}

export const isLive = (r: Replay) => !r.playing && r.at >= r.to;

/** Advances the clock by `dtSeconds` of real time. It stops at the live moment. */
export function stepReplay(r: Replay, dtSeconds: number): Replay {
  if (!r.playing || dtSeconds <= 0) return r;
  const at = r.at + dtSeconds * REPLAY_RATE * r.speed;
  return at >= r.to ? { ...r, at: r.to, playing: false } : { ...r, at };
}

/** Play from where it is; from the start of the week when it sits at the live moment. */
export function playReplay(r: Replay): Replay {
  return { ...r, playing: true, at: r.at >= r.to ? r.from : r.at };
}

export function seekReplay(r: Replay, at: Ms): Replay {
  return { ...r, at: Math.min(r.to, Math.max(r.from, at)) };
}

/** The moment the map is drawn for: `at` rounded down to a tick, but the live moment exactly. */
export function replayFrame(r: Replay): Ms {
  return r.at >= r.to ? r.to : r.from + Math.floor((r.at - r.from) / REPLAY_TICK) * REPLAY_TICK;
}

/** A shipment as it was known at `at`: null before it was placed; otherwise only the events
 * scanned by then count. Events go by `at`, never arrival order. */
export function timingAsOf(
  s: { timing: ShipmentTiming; events: readonly ShipmentEvent[] },
  at: Ms,
): ShipmentTiming | null {
  const { timing } = s;
  if (timing.placedAt > at) return null;
  const summary = summarizeEvents(s.events.filter((e) => e.at <= at));
  return {
    ...timing,
    status: summary.status ?? "label_created",
    shippedAt: timing.shippedAt !== null && timing.shippedAt <= at ? timing.shippedAt : null,
    deliveredAt: summary.deliveredAt,
    lastEventAt: summary.lastEventAt,
    carrierEtaAt: summary.deliveredAt === null ? summary.carrierEtaAt : null,
  };
}
