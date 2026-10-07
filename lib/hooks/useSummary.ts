'use client'

import { useEndpoint } from './useEndpoint'
import type { Summary } from './types'

export const useSummary = () => useEndpoint<Summary>('/api/summary')
