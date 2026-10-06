import { describe, expect, it } from "vitest";
import { compactCount, regionCountsText } from "./loadText";

describe("regionCountsText", () => {
  it("lists problems first and skips empty statuses", () => {
    expect(regionCountsText({ on_time: 7, at_risk: 2, late: 3 })).toBe("3 late · 2 at risk · 7 on time");
    expect(regionCountsText({ on_time: 1200, at_risk: 0, late: 0 })).toBe("1,200 on time");
    expect(regionCountsText({ on_time: 0, at_risk: 0, late: 0 })).toBe("No open orders");
  });
});

describe("compactCount", () => {
  it("shortens thousands", () => {
    expect(compactCount(950)).toBe("950");
    expect(compactCount(1234)).toBe("1.2k");
    expect(compactCount(12_400)).toBe("12k");
  });
});
