'use client'

import { REGIONS } from '@/lib/regions'
import { useLateOrders } from '@/lib/hooks/useLateOrders'
import { useCloseOnEscape } from '@/lib/hooks/useCloseOnEscape'
import { useStore } from '@/lib/store'
import { fmt } from './format'

export default function LateList() {
  const region = useStore((s) => s.selectedRegion)
  const selectRegion = useStore((s) => s.selectRegion)
  const { data, error } = useLateOrders(region)
  useCloseOnEscape()

  if (!region) return null
  const name = REGIONS.find((r) => r.id === region)?.name ?? region

  return (
    <section className="late-list" aria-label={`${name} late orders`}>
      <header>
        <h2>{name}</h2>
        <span className="late-count">
          <span className="swatch fill-late" aria-hidden="true" />
          {data ? fmt(data.lateCount) : '–'}
        </span>
        <button type="button" className="close" aria-label="Close list" onClick={() => selectRegion(null)}>
          ×
        </button>
      </header>
      {data && (
        <ol>
          {data.orders.map((o) => (
            <li key={o.name}>
              <span className="mono muted">{o.name}</span>
              <span>{o.city}</span>
              <span className="late-count">+{o.daysLate}d</span>
            </li>
          ))}
        </ol>
      )}
      {data && data.remaining > 0 && <p className="more mono muted">+ {fmt(data.remaining)} more</p>}
      {error && <p className="more muted">Can’t refresh right now.</p>}
    </section>
  )
}
