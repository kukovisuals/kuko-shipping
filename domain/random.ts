// Seeded random numbers. Anything drawn on both the server and the browser must come from here
// with a fixed seed, or hydration differs.
export type Random = {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  range(min: number, max: number): number;
  /** Whole number in [min, max]. */
  int(min: number, max: number): number;
  /** True with probability `p`. */
  chance(p: number): boolean;
  /** One key, picked by weight. */
  pick<K>(weights: readonly (readonly [K, number])[]): K;
};

/** mulberry32: small, fast, and the same sequence for the same seed everywhere. */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => min + Math.floor((max - min + 1) * next()),
    chance: (p) => next() < p,
    pick(weights) {
      const total = weights.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [key, w] of weights) {
        r -= w;
        if (r < 0) return key;
      }
      return weights[weights.length - 1][0];
    },
  };
}
