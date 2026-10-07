'use client'

import { useSyncExternalStore } from 'react'
import { tokens, type Theme } from '@/lib/tokens'

// Same rule as the DOM toggle: <html data-theme> if set, otherwise follow the OS.
function currentTheme(): Theme {
  const saved = document.documentElement.dataset.theme
  if (saved === 'dark' || saved === 'light') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const media = matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', notify)
  return () => {
    observer.disconnect()
    media.removeEventListener('change', notify)
  }
}

// Colors for the Canvas, from lib/tokens.ts (rule 7). The Canvas is its own React root,
// so it can't use the DOM's state; it watches the same <html> attribute instead.
export function useThemeColors() {
  return tokens[useSyncExternalStore(subscribe, currentTheme, () => 'light' as Theme)]
}
