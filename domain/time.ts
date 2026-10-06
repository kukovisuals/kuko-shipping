// Times are UTC epoch milliseconds. Days are fixed 24 h counted in UTC; a time zone is used only
// to display a time.
export type Ms = number;

export const HOUR: Ms = 3_600_000;
export const DAY: Ms = 24 * HOUR;

const ZONED_ISO = /(Z|[+-]\d{2}:?\d{2})$/i;

/** Parses an ISO time that names its zone. A bare "2026-09-28T14:05" would be read in the
 * machine's local zone, so it is refused. */
export function parseIso(iso: string): Ms {
  const trimmed = iso.trim();
  const ms = ZONED_ISO.test(trimmed) ? Date.parse(trimmed) : Number.NaN;
  if (Number.isNaN(ms)) throw new Error(`Invalid time (needs a zone, e.g. Z): ${iso}`);
  return ms;
}

export function toIso(ms: Ms): string {
  return new Date(ms).toISOString();
}

function parts(ms: Ms, timeZone: string): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(fmt.formatToParts(ms).map((p) => [p.type, p.value]));
}

/** "YYYY-MM-DD" in the given time zone. */
export function localDate(ms: Ms, timeZone: string): string {
  const p = parts(ms, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** "YYYY-MM-DD HH:mm" in the given time zone. */
export function localDateTime(ms: Ms, timeZone: string): string {
  const p = parts(ms, timeZone);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
