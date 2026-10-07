// Destination cities for the seed: the 51 state capitals (50 states + DC), one per state (D-010).
// Real coordinates. `weight` = how often orders go there, roughly the state's population.
// The region of each city comes from lib/regions.ts (by state), so it is not repeated here.

export type City = { city: string; state: string; lat: number; lng: number; weight: number }

export const CITIES: City[] = [
  // Northeast
  { city: 'Hartford', state: 'CT', lat: 41.7658, lng: -72.6734, weight: 1 },
  { city: 'Augusta', state: 'ME', lat: 44.3106, lng: -69.7795, weight: 1 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589, weight: 2 },
  { city: 'Concord', state: 'NH', lat: 43.2081, lng: -71.5376, weight: 1 },
  { city: 'Providence', state: 'RI', lat: 41.824, lng: -71.4128, weight: 1 },
  { city: 'Montpelier', state: 'VT', lat: 44.2601, lng: -72.5754, weight: 1 },
  { city: 'Trenton', state: 'NJ', lat: 40.2206, lng: -74.7597, weight: 3 },
  { city: 'Albany', state: 'NY', lat: 42.6526, lng: -73.7562, weight: 6 },
  { city: 'Harrisburg', state: 'PA', lat: 40.2732, lng: -76.8867, weight: 4 },

  // Midwest
  { city: 'Springfield', state: 'IL', lat: 39.7817, lng: -89.6501, weight: 4 },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581, weight: 2 },
  { city: 'Lansing', state: 'MI', lat: 42.7325, lng: -84.5555, weight: 3 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, weight: 3 },
  { city: 'Madison', state: 'WI', lat: 43.0731, lng: -89.4012, weight: 2 },
  { city: 'Des Moines', state: 'IA', lat: 41.5868, lng: -93.625, weight: 1 },
  { city: 'Topeka', state: 'KS', lat: 39.0473, lng: -95.6752, weight: 1 },
  { city: 'Saint Paul', state: 'MN', lat: 44.9537, lng: -93.09, weight: 2 },
  { city: 'Jefferson City', state: 'MO', lat: 38.5767, lng: -92.1735, weight: 2 },
  { city: 'Lincoln', state: 'NE', lat: 40.8136, lng: -96.7026, weight: 1 },
  { city: 'Bismarck', state: 'ND', lat: 46.8083, lng: -100.7837, weight: 1 },
  { city: 'Pierre', state: 'SD', lat: 44.3683, lng: -100.351, weight: 1 },

  // South
  { city: 'Dover', state: 'DE', lat: 39.1582, lng: -75.5244, weight: 1 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369, weight: 1 },
  { city: 'Tallahassee', state: 'FL', lat: 30.4383, lng: -84.2807, weight: 6 },
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388, weight: 3 },
  { city: 'Annapolis', state: 'MD', lat: 38.9784, lng: -76.4922, weight: 2 },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382, weight: 3 },
  { city: 'Columbia', state: 'SC', lat: 34.0007, lng: -81.0348, weight: 1 },
  { city: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.436, weight: 2 },
  { city: 'Charleston', state: 'WV', lat: 38.3498, lng: -81.6326, weight: 1 },
  { city: 'Montgomery', state: 'AL', lat: 32.3668, lng: -86.3, weight: 1 },
  { city: 'Frankfort', state: 'KY', lat: 38.2009, lng: -84.8733, weight: 1 },
  { city: 'Jackson', state: 'MS', lat: 32.2988, lng: -90.1848, weight: 1 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816, weight: 2 },
  { city: 'Little Rock', state: 'AR', lat: 34.7465, lng: -92.2896, weight: 1 },
  { city: 'Baton Rouge', state: 'LA', lat: 30.4515, lng: -91.1871, weight: 1 },
  { city: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164, weight: 1 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431, weight: 9 },

  // West (Alaska and Hawaii feed the map insets)
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074, weight: 2 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, weight: 2 },
  { city: 'Boise', state: 'ID', lat: 43.615, lng: -116.2023, weight: 1 },
  { city: 'Helena', state: 'MT', lat: 46.5891, lng: -112.0391, weight: 1 },
  { city: 'Carson City', state: 'NV', lat: 39.1638, lng: -119.7674, weight: 1 },
  { city: 'Santa Fe', state: 'NM', lat: 35.687, lng: -105.9378, weight: 1 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.891, weight: 1 },
  { city: 'Cheyenne', state: 'WY', lat: 41.14, lng: -104.8202, weight: 1 },
  { city: 'Juneau', state: 'AK', lat: 58.3019, lng: -134.4197, weight: 1 },
  { city: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944, weight: 11 },
  { city: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583, weight: 1 },
  { city: 'Salem', state: 'OR', lat: 44.9429, lng: -123.0351, weight: 1 },
  { city: 'Olympia', state: 'WA', lat: 47.0379, lng: -122.9007, weight: 2 },
]
