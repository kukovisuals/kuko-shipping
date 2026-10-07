// State -> region. US Census regions (OPEN-05 default). DC counts as South.
// Used only by the Status Engine; nothing else decides a region.

export type Region = 'WEST' | 'MIDWEST' | 'NE' | 'SOUTH'

const STATES_BY_REGION: Record<Region, string[]> = {
  NE: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
  MIDWEST: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
  SOUTH: [
    'DE', 'DC', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV',
    'AL', 'KY', 'MS', 'TN', 'AR', 'LA', 'OK', 'TX',
  ],
  WEST: ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA'],
}

const REGION_BY_STATE: Record<string, Region> = Object.fromEntries(
  (Object.entries(STATES_BY_REGION) as [Region, string[]][]).flatMap(([region, states]) =>
    states.map((state) => [state, region]),
  ),
)

export function regionForState(state: string): Region {
  const region = REGION_BY_STATE[state.toUpperCase()]
  if (!region) throw new Error(`Unknown state code: "${state}"`)
  return region
}

// The four regions in display order, with the names the API returns.
export const REGIONS: { id: Region; name: string }[] = [
  { id: 'WEST', name: 'West' },
  { id: 'MIDWEST', name: 'Midwest' },
  { id: 'NE', name: 'NE' },
  { id: 'SOUTH', name: 'South' },
]

export function parseRegion(value: string): Region | null {
  const id = value.toUpperCase()
  return REGIONS.find((r) => r.id === id)?.id ?? null
}

// us-atlas identifies states by 2-digit FIPS id. The map uses this to merge
// states into regions; the table above stays the only place a region is decided.
const STATE_BY_FIPS: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT',
  '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL',
  '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
  '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE',
  '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV',
  '55': 'WI', '56': 'WY',
}

// Throws for territories (60, 66, 69, 72, 78): they belong to no region, so the map skips them.
export function regionForFips(fips: string): Region {
  const state = STATE_BY_FIPS[fips]
  if (!state) throw new Error(`Unknown FIPS code: "${fips}"`)
  return regionForState(state)
}
