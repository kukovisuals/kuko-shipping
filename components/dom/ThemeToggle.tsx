'use client'

import { useSyncExternalStore } from 'react'
import type { Theme } from '@/lib/tokens'

const KEY = 'theme'
const listeners = new Set<() => void>()

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => void listeners.delete(notify)
}

// The saved choice lives on <html data-theme>; with none, follow the OS.
function currentTheme(): Theme {
  const saved = document.documentElement.dataset.theme
  if (saved === 'dark' || saved === 'light') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function choose(next: Theme) {
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {}
  listeners.forEach((notify) => notify())
}

// Light and dark recolour one design; nothing else changes.
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'light' as Theme)

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {(['light', 'dark'] as const).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => choose(t)}>
          {t === 'light' ? 'Light' : 'Dark'}
        </button>
      ))}
    </div>
  )
}
