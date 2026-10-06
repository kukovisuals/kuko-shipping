import type { LatLng } from "@/domain/map/project";

// The lower 48 states plus DC: the only places trucks drive to. Each state has one anchor, its
// main city, where its trucks stop; anchors are nudged inland where the 0.25° land grid puts the
// city in water. `population` is in millions (2020 census, rounded) and only weights the demo's
// "other states" share.
export type UsState = { code: string; name: string; city: string; population: number } & LatLng;

export const US_STATES = [
  { code: "AL", name: "Alabama", city: "Birmingham", lat: 33.52, lng: -86.8, population: 5.0 },
  { code: "AZ", name: "Arizona", city: "Phoenix", lat: 33.45, lng: -112.07, population: 7.2 },
  { code: "AR", name: "Arkansas", city: "Little Rock", lat: 34.75, lng: -92.29, population: 3.0 },
  { code: "CA", name: "California", city: "Los Angeles", lat: 34.05, lng: -118.24, population: 39.5 },
  { code: "CO", name: "Colorado", city: "Denver", lat: 39.74, lng: -104.99, population: 5.8 },
  { code: "CT", name: "Connecticut", city: "Hartford", lat: 41.76, lng: -72.67, population: 3.6 },
  { code: "DE", name: "Delaware", city: "Wilmington", lat: 39.74, lng: -75.55, population: 1.0 },
  { code: "DC", name: "District of Columbia", city: "Washington", lat: 38.91, lng: -77.04, population: 0.7 },
  { code: "FL", name: "Florida", city: "Miami", lat: 25.76, lng: -80.19, population: 21.5 },
  { code: "GA", name: "Georgia", city: "Atlanta", lat: 33.75, lng: -84.39, population: 10.7 },
  { code: "ID", name: "Idaho", city: "Boise", lat: 43.62, lng: -116.2, population: 1.8 },
  { code: "IL", name: "Illinois", city: "Chicago", lat: 41.88, lng: -87.63, population: 12.8 },
  { code: "IN", name: "Indiana", city: "Indianapolis", lat: 39.77, lng: -86.16, population: 6.8 },
  { code: "IA", name: "Iowa", city: "Des Moines", lat: 41.59, lng: -93.62, population: 3.2 },
  { code: "KS", name: "Kansas", city: "Wichita", lat: 37.69, lng: -97.34, population: 2.9 },
  { code: "KY", name: "Kentucky", city: "Louisville", lat: 38.25, lng: -85.76, population: 4.5 },
  { code: "LA", name: "Louisiana", city: "New Orleans", lat: 29.95, lng: -90.07, population: 4.7 },
  { code: "ME", name: "Maine", city: "Portland", lat: 43.66, lng: -70.26, population: 1.4 },
  { code: "MD", name: "Maryland", city: "Baltimore", lat: 39.29, lng: -76.61, population: 6.2 },
  { code: "MA", name: "Massachusetts", city: "Boston", lat: 42.36, lng: -71.06, population: 7.0 },
  { code: "MI", name: "Michigan", city: "Detroit", lat: 42.33, lng: -83.05, population: 10.1 },
  { code: "MN", name: "Minnesota", city: "Minneapolis", lat: 44.98, lng: -93.27, population: 5.7 },
  { code: "MS", name: "Mississippi", city: "Jackson", lat: 32.3, lng: -90.18, population: 3.0 },
  { code: "MO", name: "Missouri", city: "Kansas City", lat: 39.1, lng: -94.58, population: 6.2 },
  { code: "MT", name: "Montana", city: "Billings", lat: 45.78, lng: -108.5, population: 1.1 },
  { code: "NE", name: "Nebraska", city: "Omaha", lat: 41.26, lng: -95.93, population: 2.0 },
  { code: "NV", name: "Nevada", city: "Las Vegas", lat: 36.17, lng: -115.14, population: 3.1 },
  { code: "NH", name: "New Hampshire", city: "Manchester", lat: 42.99, lng: -71.46, population: 1.4 },
  { code: "NJ", name: "New Jersey", city: "Newark", lat: 40.74, lng: -74.17, population: 9.3 },
  { code: "NM", name: "New Mexico", city: "Albuquerque", lat: 35.08, lng: -106.65, population: 2.1 },
  { code: "NY", name: "New York", city: "New York", lat: 40.71, lng: -74.01, population: 20.2 },
  { code: "NC", name: "North Carolina", city: "Charlotte", lat: 35.23, lng: -80.84, population: 10.4 },
  { code: "ND", name: "North Dakota", city: "Fargo", lat: 46.88, lng: -96.79, population: 0.8 },
  { code: "OH", name: "Ohio", city: "Columbus", lat: 39.96, lng: -83.0, population: 11.8 },
  { code: "OK", name: "Oklahoma", city: "Oklahoma City", lat: 35.47, lng: -97.52, population: 4.0 },
  { code: "OR", name: "Oregon", city: "Portland", lat: 45.52, lng: -122.68, population: 4.2 },
  { code: "PA", name: "Pennsylvania", city: "Philadelphia", lat: 39.95, lng: -75.17, population: 13.0 },
  { code: "RI", name: "Rhode Island", city: "Providence", lat: 41.82, lng: -71.41, population: 1.1 },
  { code: "SC", name: "South Carolina", city: "Columbia", lat: 34.0, lng: -81.03, population: 5.1 },
  { code: "SD", name: "South Dakota", city: "Sioux Falls", lat: 43.54, lng: -96.73, population: 0.9 },
  { code: "TN", name: "Tennessee", city: "Nashville", lat: 36.16, lng: -86.78, population: 6.9 },
  { code: "TX", name: "Texas", city: "Houston", lat: 29.76, lng: -95.37, population: 29.1 },
  { code: "UT", name: "Utah", city: "Salt Lake City", lat: 40.76, lng: -111.89, population: 3.3 },
  { code: "VT", name: "Vermont", city: "Burlington", lat: 44.48, lng: -73.21, population: 0.6 },
  { code: "VA", name: "Virginia", city: "Richmond", lat: 37.54, lng: -77.44, population: 8.6 },
  { code: "WA", name: "Washington", city: "Seattle", lat: 47.61, lng: -122.33, population: 7.7 },
  { code: "WV", name: "West Virginia", city: "Charleston", lat: 38.35, lng: -81.63, population: 1.8 },
  { code: "WI", name: "Wisconsin", city: "Milwaukee", lat: 43.04, lng: -88.05, population: 5.9 },
  { code: "WY", name: "Wyoming", city: "Cheyenne", lat: 41.14, lng: -104.82, population: 0.6 },
] as const satisfies readonly UsState[];

export type StateCode = (typeof US_STATES)[number]["code"];

const BY_CODE = new Map<string, UsState>(US_STATES.map((s) => [s.code, s]));

export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && BY_CODE.has(value);
}

export function usState(code: StateCode): UsState {
  return BY_CODE.get(code)!;
}

/** The lower 48's bounding box, with a little sea around it. */
export const US_BOUNDS = { west: -125.5, east: -66.5, south: 24, north: 50 } as const;
