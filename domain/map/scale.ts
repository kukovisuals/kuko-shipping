/** Destination disc radius, growing with the log of the shipments it holds (a state can hold
 * hundreds), capped so a busy state doesn't cover its neighbours. */
export function pinRadius(count: number): number {
  return Math.min(0.5, 0.16 + 0.03 * Math.log2(Math.max(1, count)));
}
