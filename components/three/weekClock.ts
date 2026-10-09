// The weekly loop (wiki 11): how the orders could move in a week. Pure, so it is easy to test.
// Time `t` is in days, 0 .. WEEK. Each order day leaves the lane start at a moment set by its age (the
// oldest orders go first), travels to its resting slot, and then either stays (late) or fades (on time).
// At t = WEEK every bead is exactly where the still map puts it: late beads at rest, on-time beads gone.

export const WEEK = 7 // days in one loop
export const DAY_SECONDS = 2 // one loop = 14 s
export const HOLD = 0.75 // days spent resting on the finished week before the loop restarts

const DEPART_SPAN = 3.5 // days over which the departures are spread (oldest first)
const TRAVEL = 2.5 // days a bead takes from the lane start to its slot
const FADE = 1 // days an on-time bead takes to fade out after arriving
// DEPART_SPAN + TRAVEL + FADE === WEEK, so the last bead finishes exactly at the end.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => x * x * (3 - 2 * x)

// Moves the clock on by `seconds`; after WEEK it rests for HOLD days, then starts again at 0.
export function advance(t: number, seconds: number): number {
  const next = t + seconds / DAY_SECONDS
  return next >= WEEK + HOLD ? 0 : next
}

// Which weekday (0 = Mon .. 6 = Sun) the clock is in.
export const dayOf = (t: number) => Math.min(6, Math.max(0, Math.floor(t)))

export type BeadFrame = {
  along: number // 0 at the lane start .. 1 at its slot
  scale: number // multiplies the bead's size; 0 = not on the map
  fade: number // 0 = full color .. 1 = page color (on-time beads after arriving)
}

export function beadFrame(age: number, maxAge: number, late: boolean, t: number): BeadFrame {
  const depart = maxAge > 0 ? (1 - age / maxAge) * DEPART_SPAN : 0
  if (t < depart) return { along: 0, scale: 0, fade: 0 }
  const along = smooth(clamp01((t - depart) / TRAVEL))
  if (late) return { along, scale: 1, fade: 0 }
  const fade = clamp01((t - depart - TRAVEL) / FADE)
  return { along, scale: fade >= 1 ? 0 : 1, fade }
}
