'use client'

import { REGIONS } from '@/lib/regions'
import { useSummary } from '@/lib/hooks/useSummary'
import { useStore } from '@/lib/store'
import Bar from './Bar'
import { fmt } from './format'

export default function Sidebar() {
  const { data } = useSummary()
  const selected = useStore((s) => s.selectedRegion)
  const selectRegion = useStore((s) => s.selectRegion)

  return (
    <nav className="sidebar" aria-label="Regions">
      {REGIONS.map(({ id, name }) => {
        const row = data?.regions.find((r) => r.id === id)
        return (
          <button
            key={id}
            type="button"
            className="region-row"
            aria-pressed={selected === id}
            onClick={() => selectRegion(id)}
          >
            <span className="region-name">{name}</span>
            <Bar name={name} onTime={row?.onTime ?? 0} late={row?.late ?? 0} />
            <span className="late-count">{row ? fmt(row.late) : '–'}</span>
          </button>
        )
      })}
    </nav>
  )
}
