export const MAX_SKU_LENGTH = 64;

/** SKUs compare trimmed and upper-case, so "dw-dark-gr-1lb " and "DW-DARK-GR-1LB" are one SKU. */
export function normalizeSku(raw: string): string {
  return raw.trim().toUpperCase();
}

/** 1–64 characters, no spaces. Checked after normalizing. */
export function isValidSku(raw: string): boolean {
  return new RegExp(`^\\S{1,${MAX_SKU_LENGTH}}$`).test(normalizeSku(raw));
}
