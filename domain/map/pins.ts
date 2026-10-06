import { MAP, type LatLng } from "@/domain/map/project";

export type Pin<T extends LatLng> = LatLng & { count: number; items: T[] };

/** Destinations closer than `mergeDeg` share a pin, and so do their neighbours in turn, so the
 * orders scattered around one city become one pin. The result does not depend on input order. */
export function mergePins<T extends LatLng>(points: readonly T[], mergeDeg: number = MAP.pinMergeDeg): Pin<T>[] {
  const sorted = [...points].sort((p, q) => p.lat - q.lat || p.lng - q.lng);
  const parent = sorted.map((_, i) => i);
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i])));

  // Bucket into mergeDeg cells; a close neighbour is always in the same or an adjacent cell.
  const cell = (v: number) => Math.floor(v / mergeDeg);
  const buckets = new Map<string, number[]>();
  sorted.forEach((p, i) => {
    const key = `${cell(p.lat)},${cell(p.lng)}`;
    buckets.set(key, [...(buckets.get(key) ?? []), i]);
  });
  sorted.forEach((p, i) => {
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        for (const j of buckets.get(`${cell(p.lat) + dLat},${cell(p.lng) + dLng}`) ?? []) {
          const q = sorted[j];
          if (j > i && Math.hypot(p.lat - q.lat, p.lng - q.lng) < mergeDeg) parent[root(j)] = root(i);
        }
      }
    }
  });

  const groups = new Map<number, T[]>();
  sorted.forEach((p, i) => groups.set(root(i), [...(groups.get(root(i)) ?? []), p]));
  return [...groups.values()].map((items) => ({
    lat: items.reduce((s, p) => s + p.lat, 0) / items.length,
    lng: items.reduce((s, p) => s + p.lng, 0) / items.length,
    count: items.length,
    items,
  }));
}
