export const MOVEMENT_REASONS = ["received", "shipped", "returned", "adjusted", "counted"] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

/** One ledger row. The ledger is the only source of stock. */
export type Movement = {
  variantId: string;
  warehouseId: string;
  delta: number;
  reason: MovementReason;
  ref: string | null; // shipment id, PO number or note
};
