import type { DelayStatus } from "@/domain/ship/status";
import type { StockFlag } from "@/domain/stock/lowStock";
import type { ThemeColor } from "@/ui/theme";

export const STATUS_TOKEN: Record<DelayStatus, ThemeColor> = {
  on_time: "statusOnTime",
  at_risk: "statusAtRisk",
  late: "statusLate",
  delivered_late: "statusDeliveredLate",
};

export const STOCK_TOKEN: Record<StockFlag, ThemeColor> = { ok: "flow", low: "statusAtRisk", out: "statusLate" };
