import { describe, expect, it } from "vitest";
import {
  DELAY_STATUSES,
  DELAY_STATUS_LABEL,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABEL,
  isShipmentStatus,
} from "./status";

describe("statuses", () => {
  it("has a label for every status", () => {
    for (const s of SHIPMENT_STATUSES) expect(SHIPMENT_STATUS_LABEL[s]).toBeTruthy();
    for (const s of DELAY_STATUSES) expect(DELAY_STATUS_LABEL[s]).toBeTruthy();
  });

  it("recognises only the six shipment statuses", () => {
    expect(isShipmentStatus("out_for_delivery")).toBe(true);
    expect(isShipmentStatus("lost")).toBe(false);
    expect(isShipmentStatus(3)).toBe(false);
  });
});
