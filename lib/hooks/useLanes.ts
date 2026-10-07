'use client'

import { useEndpoint } from './useEndpoint'
import type { Lanes } from './types'

export const useLanes = () => useEndpoint<Lanes>('/api/lanes')
