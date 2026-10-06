import { describe, expect, it } from "vitest";
import { seededRandom } from "./random";

describe("seededRandom", () => {
  it("gives the same sequence for the same seed", () => {
    const a = seededRandom(4242);
    const b = seededRandom(4242);
    const seqA = Array.from({ length: 5 }, () => a.next());
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(seqA);
    expect(seededRandom(7).next()).not.toBe(seqA[0]);
  });

  it("stays in range", () => {
    const r = seededRandom(1);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const n = r.int(2, 5);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it("picks by weight", () => {
    const r = seededRandom(9);
    const hits = { a: 0, b: 0 };
    for (let i = 0; i < 10_000; i++) hits[r.pick([["a", 3], ["b", 1]] as const)]++;
    expect(hits.a / 10_000).toBeCloseTo(0.75, 1);
  });
});
