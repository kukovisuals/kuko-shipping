// The weekly loop (wiki 11): how the late orders could move in a week. Pure, so it is easy to test.
// Time `t` is in days, 0 .. WEEK. Each late order day leaves the lane start at a moment set by its age (the
// oldest first), and travels to its resting slot. On-time orders are never drawn (D-013).
// At t = WEEK every bead is exactly where the still map puts it.

export const WEEK = 7 // days in one loop
export const DAY_SECONDS = 2 // one loop = 14 s
export const HOLD = 0.75 // days spent resting on the finished week before the loop restarts

const DEPART_SPAN = 4 // days over which the departures are spread (oldest first)
const TRAVEL = 3 // days a bead takes from the lane start to its slot
// DEPART_SPAN + TRAVEL === WEEK, so the last bead arrives exactly at the end.

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
  scale: number // multiplies the bead's size; 0 = not on the map yet
}

// `minAge` and `maxAge` are the youngest and oldest late order day on the map; departures are spread between them.
export function beadFrame(age: number, minAge: number, maxAge: number, t: number): BeadFrame {
  const depart = maxAge > minAge ? ((maxAge - age) / (maxAge - minAge)) * DEPART_SPAN : 0
  if (t < depart) return { along: 0, scale: 0 }
  return { along: smooth(clamp01((t - depart) / TRAVEL)), scale: 1 }
}
