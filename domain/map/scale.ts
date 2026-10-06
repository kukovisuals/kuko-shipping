import { clamp } from "@/domain/map/bounds";

export const TOWER = { minHeight: 2, maxHeight: 10, unitsAtMax: 100_000 } as const;

/** Warehouse tower height from total units on hand, on a log scale from 2 (empty) to 10. */
export function towerHeight(units: number): number {
  const { minHeight, maxHeight, unitsAtMax } = TOWER;
  const share = Math.log10(Math.max(0, units) + 1) / Math.log10(unitsAtMax + 1);
  return minHeight + (maxHeight - minHeight) * clamp(share, 0, 1);
}

/** Destination post height, growing with the log of the shipments it holds (a state can hold
 * hundreds). */
export function pinHeight(count: number): number {
  return 0.2 + 0.15 * Math.log2(Math.max(1, count));
}
