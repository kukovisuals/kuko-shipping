'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Refresh interval (OPEN-07 default: 5 minutes).
export const REFRESH_MS = 5 * 60 * 1000

type Snapshot<T> = { data: T | null; error: string | null }

type Entry = {
  snapshot: Snapshot<unknown>
  listeners: Set<() => void>
  timer: ReturnType<typeof setInterval> | null
  inFlight: boolean
}

const EMPTY: Snapshot<never> = { data: null, error: null }
const entries = new Map<string, Entry>()

function entryFor(url: string): Entry {
  let entry = entries.get(url)
  if (!entry) {
    entry = { snapshot: EMPTY, listeners: new Set(), timer: null, inFlight: false }
    entries.set(url, entry)
  }
  return entry
}

async function load(url: string) {
  const entry = entryFor(url)
  if (entry.inFlight) return
  entry.inFlight = true
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status}`)
    // Last good data stays until new data arrives; never flash empty.
    entry.snapshot = { data: await res.json(), error: null }
  } catch (e) {
    entry.snapshot = { data: entry.snapshot.data, error: e instanceof Error ? e.message : 'failed' }
  } finally {
    entry.inFlight = false
    entry.listeners.forEach((notify) => notify())
  }
}

function subscribe(url: string, notify: () => void) {
  const entry = entryFor(url)
  entry.listeners.add(notify)
  if (entry.listeners.size === 1) {
    void load(url)
    entry.timer = setInterval(() => void load(url), REFRESH_MS)
  }
  return () => {
    entry.listeners.delete(notify)
    if (entry.listeners.size === 0 && entry.timer) {
      clearInterval(entry.timer)
      entry.timer = null
    }
  }
}

// One fetch and one timer per URL, shared by every component that asks for it.
// A module-level store (not React context) so the 3D Canvas root can read it too.
export function useEndpoint<T>(url: string | null): Snapshot<T> {
  const sub = useCallback(
    (notify: () => void) => (url ? subscribe(url, notify) : () => {}),
    [url],
  )
  const get = useCallback(
    () => (url ? (entryFor(url).snapshot as Snapshot<T>) : EMPTY),
    [url],
  )
  return useSyncExternalStore(sub, get, () => EMPTY)
}
