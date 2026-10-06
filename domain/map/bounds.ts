import { MAP, type LatLng, type Vec3 } from "@/domain/map/project";

export function isValidLatLng(p: Partial<LatLng> | null | undefined): p is LatLng {
  if (!p) return false;
  const { lat, lng } = p;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** True when a scene point lies over the map (|x| ≤ 180, |z| ≤ 90). Height is not checked. */
export function insideMap({ x, z }: Pick<Vec3, "x" | "z">): boolean {
  return Math.abs(x) <= MAP.width / 2 && Math.abs(z) <= MAP.height / 2;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
