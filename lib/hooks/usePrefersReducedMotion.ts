'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(notify: () => void) {
  const mq = matchMedia(QUERY)
  mq.addEventListener('change', notify)
  return () => mq.removeEventListener('change', notify)
}

// True when the system asks for less motion (wiki 11): skip animation, show the end state at once.
// The server snapshot is false; the Canvas is client-only, so 3D code never renders on the server.
export const usePrefersReducedMotion = () =>
  useSyncExternalStore(subscribe, () => matchMedia(QUERY).matches, () => false)
