import { Color } from "three";
import type { DelayStatus } from "@/domain/ship/status";
import type { StockFlag } from "@/domain/stock/lowStock";
import { THEME, type ThemeColor } from "@/ui/theme";

export const STATUS_TOKEN: Record<DelayStatus, ThemeColor> = {
  on_time: "statusOnTime",
  at_risk: "statusAtRisk",
  late: "statusLate",
  delivered_late: "statusDeliveredLate",
};

export const STOCK_TOKEN: Record<StockFlag, ThemeColor> = { ok: "flow", low: "statusAtRisk", out: "statusLate" };

/** A theme colour pushed above 1 so the bloom pass (threshold 1) lights it. */
export function glow(token: ThemeColor, strength = 2): Color {
  return new Color(THEME[token]).multiplyScalar(strength);
}
