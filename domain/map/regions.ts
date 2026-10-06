import type { LatLng } from "@/domain/map/project";
import type { StateCode } from "@/domain/map/usStates";

// The four US Census regions. The map summarises each as one ring and draws trucks for one region
// at a time, so the country never fills with every truck at once.
export const REGIONS = ["west", "midwest", "south", "northeast"] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_NAME: Record<Region, string> = {
  west: "West",
  midwest: "Midwest",
  south: "South",
  northeast: "Northeast",
};

/** Where each region's ring stands: inside the region, clear of the busiest roads. */
export const REGION_HUB: Record<Region, LatLng> = {
  west: { lat: 39.2, lng: -114.5 },
  midwest: { lat: 41.6, lng: -95.5 },
  south: { lat: 32.2, lng: -92.5 },
  northeast: { lat: 40.6, lng: -79.6 },
};

const MEMBERS: Record<Region, readonly StateCode[]> = {
  west: ["WA", "OR", "CA", "NV", "ID", "MT", "WY", "UT", "CO", "AZ", "NM"],
  midwest: ["ND", "SD", "NE", "KS", "MN", "IA", "MO", "WI", "IL", "IN", "MI", "OH"],
  south: ["TX", "OK", "AR", "LA", "MS", "AL", "TN", "KY", "WV", "VA", "NC", "SC", "GA", "FL", "MD", "DE", "DC"],
  northeast: ["PA", "NY", "NJ", "CT", "RI", "MA", "VT", "NH", "ME"],
};

const BY_STATE = new Map<StateCode, Region>(REGIONS.flatMap((r) => MEMBERS[r].map((s) => [s, r] as const)));

export function regionOf(state: StateCode): Region {
  return BY_STATE.get(state)!;
}

export function regionStates(region: Region): readonly StateCode[] {
  return MEMBERS[region];
}
