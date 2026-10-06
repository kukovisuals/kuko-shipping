export const SHIPMENT_STATUSES = [
  "label_created",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "returned",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const DELAY_STATUSES = ["on_time", "at_risk", "late", "delivered_late"] as const;
export type DelayStatus = (typeof DELAY_STATUSES)[number];

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  label_created: "Label created",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
  returned: "Returned",
};

export const DELAY_STATUS_LABEL: Record<DelayStatus, string> = {
  on_time: "On time",
  at_risk: "At risk",
  late: "Late",
  delivered_late: "Delivered late",
};

export function isShipmentStatus(value: unknown): value is ShipmentStatus {
  return typeof value === "string" && (SHIPMENT_STATUSES as readonly string[]).includes(value);
}
