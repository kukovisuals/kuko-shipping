import { COMPANY_TIME_ZONE } from "@/config/map";
import { usState } from "@/domain/map/usStates";
import { truckDaysLate, type OpenStatus } from "@/domain/ship/regions";
import { DELAY_STATUS_LABEL } from "@/domain/ship/status";
import { localDayLabel } from "@/domain/time";
import type { MapTruck } from "./model";

/** "California · 50 orders" */
export function truckTitle(t: MapTruck): string {
  return `${usState(t.state).name} · ${t.orders.length} ${t.orders.length === 1 ? "order" : "orders"}`;
}

/** "Left Mon 5 Oct" or "Loading at the warehouse" */
export function truckLeg(t: MapTruck): string {
  return t.departedAt === null ? "Loading at the warehouse" : `Left ${localDayLabel(t.departedAt, COMPANY_TIME_ZONE)}`;
}

/** "2 of 50 late · 1 at risk · 12 delivered" — the problems first, then what is done. */
export function truckSummary(t: MapTruck): string {
  const total = t.orders.length;
  const delivered = total - t.open;
  const parts: string[] = [];
  if (t.counts.late) parts.push(`${t.counts.late} of ${total} late`);
  if (t.counts.at_risk) parts.push(`${t.counts.at_risk} ${DELAY_STATUS_LABEL.at_risk.toLowerCase()}`);
  if (parts.length === 0) parts.push(t.open === total ? "All on time" : `${t.open} on the way`);
  if (delivered) parts.push(`${delivered} delivered${t.counts.delivered_late ? ` (${t.counts.delivered_late} late)` : ""}`);
  return parts.join(" · ");
}

/** "3d late", "at risk" or "on time": the short tag for callouts and the region list. */
export function truckDelayShort(t: MapTruck): string {
  if (t.status === "late") return `${truckDaysLate(t)}d late`;
  return DELAY_STATUS_LABEL[t.status].toLowerCase();
}

/** "3 late · 2 at risk · 7 on time" (orders), problems first; "No open orders" when empty. */
export function regionCountsText(orders: Record<OpenStatus, number>): string {
  const parts = (["late", "at_risk", "on_time"] as const)
    .filter((s) => orders[s] > 0)
    .map((s) => `${orders[s].toLocaleString("en-US")} ${DELAY_STATUS_LABEL[s].toLowerCase()}`);
  return parts.length ? parts.join(" · ") : "No open orders";
}

/** 950 → "950", 1234 → "1.2k". */
export function compactCount(n: number): string {
  return n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
}
