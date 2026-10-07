'use client'

import type { Region } from '@/lib/regions'
import { useEndpoint } from './useEndpoint'
import type { LateOrders } from './types'

// Rows shown before "+ N more" (wiki 01).
export const LATE_LIST_SIZE = 6

export const useLateOrders = (region: Region | null) =>
  useEndpoint<LateOrders>(region ? `/api/regions/${region}/late?limit=${LATE_LIST_SIZE}` : null)
