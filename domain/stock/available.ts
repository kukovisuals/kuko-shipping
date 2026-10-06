import { stockKey } from "@/domain/stock/ledger";

/** A line of an order that has not shipped yet, at the warehouse it will ship from. */
export type OpenLine = { variantId: string; warehouseId: string; qty: number };

/** Reserved stock per variant per warehouse = the lines of orders not yet shipped. */
export function reservedByStock(lines: readonly OpenLine[]): Map<string, number> {
  const reserved = new Map<string, number>();
  for (const { variantId, warehouseId, qty } of lines) {
    const key = stockKey(variantId, warehouseId);
    reserved.set(key, (reserved.get(key) ?? 0) + qty);
  }
  return reserved;
}

/** On hand minus reserved. Negative means more is promised than is on the shelf. */
export function available(onHand: number, reserved: number): number {
  return onHand - reserved;
}
