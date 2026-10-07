// JSON shapes the API returns (wiki 08). Counts are integers.
import type { Region } from '@/lib/regions'

export type Counts = { count: number; onTime: number; late: number }

export type Summary = {
  computedAt: string | null
  total: Counts
  regions: (Counts & { id: Region; name: string })[]
}

export type LateOrders = {
  region: Region
  lateCount: number
  orders: { name: string; city: string; daysLate: number }[]
  remaining: number
}

export type Pipeline = {
  computedAt: string | null
  ordered: Record<Region, number>
  backorder: Record<Region, number>
  packed: Record<Region, number>
  inTransit: number
}

export type Lanes = {
  computedAt: string | null
  warehouses: { id: string; name: string; city: string; region: Region; lat: number; lng: number }[]
  lanes: {
    id: string
    warehouseId: string
    region: Region
    timing: 'ON_TIME' | 'LATE'
    shipments: number
    points: { lat: number; lng: number }[]
    destinations: { lat: number; lng: number; city: string }[]
  }[]
}
