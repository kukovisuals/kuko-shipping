export type StockFlag = "ok" | "low" | "out";

/** out at 0 on hand; low at or below the reorder point (a reorder point of 0 means never low). */
export function stockFlag(onHand: number, reorderPoint: number): StockFlag {
  if (onHand <= 0) return "out";
  if (onHand <= reorderPoint) return "low";
  return "ok";
}

const SEVERITY: Record<StockFlag, number> = { ok: 0, low: 1, out: 2 };

/** The warehouse ring shows its worst variant: red if any is out, amber if any is low. */
export function worstFlag(flags: Iterable<StockFlag>): StockFlag {
  let worst: StockFlag = "ok";
  for (const f of flags) if (SEVERITY[f] > SEVERITY[worst]) worst = f;
  return worst;
}
