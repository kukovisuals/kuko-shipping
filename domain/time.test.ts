import { describe, expect, it } from "vitest";
import { DAY, HOUR, localDate, localDateTime, parseIso, toIso } from "./time";

const NY = "America/New_York";

describe("parseIso", () => {
  it("reads zoned ISO times as UTC ms", () => {
    expect(parseIso("2026-09-28T14:05:00Z")).toBe(Date.UTC(2026, 8, 28, 14, 5));
    expect(parseIso("2026-09-28T10:05:00-04:00")).toBe(Date.UTC(2026, 8, 28, 14, 5));
  });

  it("refuses times without a zone and garbage", () => {
    expect(() => parseIso("2026-09-28T14:05:00")).toThrow(/needs a zone/);
    expect(() => parseIso("not a date")).toThrow();
  });

  it("round-trips through toIso", () => {
    expect(toIso(parseIso("2026-09-28T14:05:00Z"))).toBe("2026-09-28T14:05:00.000Z");
  });
});

describe("local display", () => {
  it("shows 23:30 New York time on its own local day, not the UTC day", () => {
    const placed = parseIso("2026-09-28T23:30:00-04:00");
    expect(toIso(placed)).toBe("2026-09-29T03:30:00.000Z");
    expect(localDate(placed, NY)).toBe("2026-09-28");
    expect(localDateTime(placed, NY)).toBe("2026-09-28 23:30");
  });

  it("counts days as fixed 24 h, so a DST change moves the local clock time", () => {
    const placed = parseIso("2026-03-07T23:30:00-05:00"); // EST, the night before DST starts
    expect(localDateTime(placed + 7 * DAY, NY)).toBe("2026-03-15 00:30"); // now EDT
  });

  it("has the expected units", () => {
    expect(DAY).toBe(24 * HOUR);
  });
});
