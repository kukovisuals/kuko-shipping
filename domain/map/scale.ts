/** Destination post height, growing with the log of the shipments it holds (a state can hold
 * hundreds). */
export function pinHeight(count: number): number {
  return 0.2 + 0.15 * Math.log2(Math.max(1, count));
}
