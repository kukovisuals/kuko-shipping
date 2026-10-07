'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

// Escape closes the late list and clears selectedRegion (wiki 11).
export function useCloseOnEscape() {
  const open = useStore((s) => s.selectedRegion !== null)
  const clear = useStore((s) => s.selectRegion)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && clear(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, clear])
}
