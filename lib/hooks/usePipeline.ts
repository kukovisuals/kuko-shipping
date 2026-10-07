'use client'

import { useEndpoint } from './useEndpoint'
import type { Pipeline } from './types'

export const usePipeline = () => useEndpoint<Pipeline>('/api/pipeline')
