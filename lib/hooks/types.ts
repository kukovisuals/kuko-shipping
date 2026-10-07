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
