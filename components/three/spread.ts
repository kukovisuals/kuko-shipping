// Pushes values apart until neighbours are at least `gap` apart, moving each as little as it can.
// Used so horizontal lanes in a region never sit on top of each other (D-010).
// Returns new values in the original order.
export function spread(values: number[], gap: number): number[] {
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b])
  const ys = order.map((i) => values[i])
  for (let pass = 0; pass < 200; pass++) {
    let moved = false
    for (let i = 0; i + 1 < ys.length; i++) {
      const short = gap - (ys[i + 1] - ys[i])
      if (short > 1e-6) {
        ys[i] -= short / 2
        ys[i + 1] += short / 2
        moved = true
      }
    }
    if (!moved) break
  }
  const out = new Array<number>(values.length)
  order.forEach((original, rank) => (out[original] = ys[rank]))
  return out
}
