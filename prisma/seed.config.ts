// The home of every seed number (wiki 06). Change numbers here, nowhere else.
// Tests and checks read these; they never retype them.

import type { Region } from '../lib/regions'

export type RegionTarget = {
  onTime: number // orders on time
  late: number // orders late
  backorder: number // orders waiting on stock
  inTransit: number // orders on a truck
  // Packed = whatever is left: onTime + late - backorder - inTransit.
}

export const SEED_CONFIG = {
  randomSeed: 4242, // same seed, same data
  firstOrderNumber: 48210, // names run #48210, #48211, ...
  // OPEN-08: placeholder warehouse, real coordinates.
  warehouse: { name: 'NJ Warehouse', city: 'Newark', state: 'NJ', lat: 40.7357, lng: -74.1724 },
  regions: {
    WEST: { onTime: 600, late: 150, backorder: 50, inTransit: 150 },
    MIDWEST: { onTime: 400, late: 100, backorder: 30, inTransit: 100 },
    NE: { onTime: 300, late: 50, backorder: 20, inTransit: 60 },
    SOUTH: { onTime: 200, late: 200, backorder: 60, inTransit: 90 },
  } satisfies Record<Region, RegionTarget>,
}

export type SeedConfig = typeof SEED_CONFIG
