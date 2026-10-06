import { describe, expect, it } from "vitest";
import { stockFlag, worstFlag } from "./lowStock";

describe("stockFlag", () => {
  it("is out at zero on hand", () => {
    expect(stockFlag(0, 30)).toBe("out");
    expect(stockFlag(0, 0)).toBe("out");
  });

  it("is low at or below the reorder point", () => {
    expect(stockFlag(30, 30)).toBe("low");
    expect(stockFlag(12, 30)).toBe("low");
  });

  it("is ok above the reorder point, and a reorder point of 0 is never low", () => {
    expect(stockFlag(31, 30)).toBe("ok");
    expect(stockFlag(1, 0)).toBe("ok");
  });
});

describe("worstFlag", () => {
  it("picks out over low over ok", () => {
    expect(worstFlag(["ok", "low", "ok"])).toBe("low");
    expect(worstFlag(["low", "out", "ok"])).toBe("out");
    expect(worstFlag(["ok"])).toBe("ok");
    expect(worstFlag([])).toBe("ok");
  });
});
