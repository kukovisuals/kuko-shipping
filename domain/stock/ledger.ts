import { MOVEMENT_REASONS, type Movement, type MovementReason } from "@/domain/stock/types";

export const MAX_REF_LENGTH = 200;

// Received and returned stock comes in; shipped stock goes out; adjusted and counted go either way.
const SIGN: Record<MovementReason, 1 | -1 | 0> = { received: 1, returned: 1, shipped: -1, adjusted: 0, counted: 0 };

/** null when the movement is well formed, otherwise the reason it is not. */
export function movementError(m: Pick<Movement, "delta" | "reason" | "ref">): string | null {
  if (!(MOVEMENT_REASONS as readonly string[]).includes(m.reason)) return "Unknown reason";
  if (!Number.isInteger(m.delta) || m.delta === 0) return "Quantity must be a whole number, not 0";
  const sign = SIGN[m.reason];
  if (sign === 1 && m.delta < 0) return `A ${m.reason} movement adds stock`;
  if (sign === -1 && m.delta > 0) return "A shipped movement takes stock";
  if (m.reason === "shipped" && !m.ref) return "A shipped movement needs the shipment id";
  if (m.ref && m.ref.length > MAX_REF_LENGTH) return `Reference is longer than ${MAX_REF_LENGTH} characters`;
  return null;
}

/** Same rule as apply_movement(): refuse anything that would take on_hand below zero. */
export function applyDelta(onHand: number, delta: number): { ok: true; onHand: number } | { ok: false } {
  const next = onHand + delta;
  return next >= 0 ? { ok: true, onHand: next } : { ok: false };
}

export function stockKey(variantId: string, warehouseId: string): string {
  return `${variantId}@${warehouseId}`;
}

const shippedKey = (m: Movement) => `${m.ref}|${stockKey(m.variantId, m.warehouseId)}`;

export type Replay = {
  onHand: Map<string, number>;
  refused: Movement[]; // would have gone below zero
  duplicates: Movement[]; // a shipment taking the same stock twice
};

/** Replays the ledger in order, as the database would apply it. */
export function replayLedger(movements: readonly Movement[]): Replay {
  const onHand = new Map<string, number>();
  const seenShipped = new Set<string>();
  const refused: Movement[] = [];
  const duplicates: Movement[] = [];
  for (const m of movements) {
    if (m.reason === "shipped") {
      if (seenShipped.has(shippedKey(m))) {
        duplicates.push(m);
        continue;
      }
    }
    const key = stockKey(m.variantId, m.warehouseId);
    const applied = applyDelta(onHand.get(key) ?? 0, m.delta);
    if (!applied.ok) {
      refused.push(m);
      continue;
    }
    onHand.set(key, applied.onHand);
    if (m.reason === "shipped") seenShipped.add(shippedKey(m));
  }
  return { onHand, refused, duplicates };
}
