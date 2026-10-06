import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, checkRules } from "./settings";

describe("DEFAULT_RULES", () => {
  it("matches the spec defaults", () => {
    expect(DEFAULT_RULES).toEqual({ slaDays: 7, riskWindowHours: 24, stallHours: 48, handlingDays: 2 });
  });
});

describe("checkRules", () => {
  it("accepts valid whole numbers", () => {
    expect(checkRules({ slaDays: 10, riskWindowHours: 12, stallHours: 72, handlingDays: 1 })).toEqual({
      ok: true,
      rules: { slaDays: 10, riskWindowHours: 12, stallHours: 72, handlingDays: 1 },
    });
  });

  it("keeps slaDays within 1–60", () => {
    expect(checkRules({ ...DEFAULT_RULES, slaDays: 0 }).ok).toBe(false);
    expect(checkRules({ ...DEFAULT_RULES, slaDays: 61 }).ok).toBe(false);
    expect(checkRules({ ...DEFAULT_RULES, slaDays: 60 }).ok).toBe(true);
  });

  it("names each bad field", () => {
    const result = checkRules({ slaDays: 7.5, riskWindowHours: "24", stallHours: 48 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fields).sort()).toEqual(["handlingDays", "riskWindowHours", "slaDays"]);
  });
});
