'use client'

import RegionCard from '@/components/dom/RegionCard'
import { useSummary } from '@/lib/hooks/useSummary'
import { REGIONS } from '@/lib/regions'
import { useStore } from '@/lib/store'
import { cardAnchors } from './regionCards'
import { MAP_BOX, usMap } from './usMapGeometry'
import { fitToZone, useZone } from './useZone'

// One card per region, from /api/summary. Plain DOM beside the Canvas (rule 5), placed with the same fit
// as the map group, so a card sits where its anchor is on the map. (drei <Html> was tried first: each one
// runs its own React root, and in dev the first card of a group got lost.)
// With a region selected the other cards fade with the map (callout 2).
export default function MapCards() {
  const { data } = useSummary()
  const selected = useStore((s) => s.selectedRegion)
  const zone = useZone('.map')
  if (!data || !zone) return null

  const { scale, cx, cy } = fitToZone(zone, MAP_BOX.w, MAP_BOX.h)
  const anchors = cardAnchors(usMap())
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {REGIONS.map(({ id }) => {
        const row = data.regions.find((r) => r.id === id)
        if (!row) return null
        const { x, y, align } = anchors[id]
        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              left: cx + x * scale,
              top: cy - y * scale,
              transform: `translate(${-align[0] * 100}%, ${-align[1] * 100}%)`,
            }}
          >
            <RegionCard
              name={row.name}
              count={row.count}
              onTime={row.onTime}
              late={row.late}
              dimmed={selected !== null && selected !== id}
            />
          </div>
        )
      })}
    </div>
  )
}
