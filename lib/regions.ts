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
