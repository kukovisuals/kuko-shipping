import type { ReactNode } from 'react'
import ThemeToggle from './ThemeToggle'

// The only place state words appear (wiki 01 rule 1).
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
      {children}
    </svg>
  )
}

const ITEMS: { label: string; symbol: ReactNode; note?: string }[] = [
  { label: 'On time', symbol: <span className="swatch fill-on" aria-hidden="true" /> },
  { label: 'Late', symbol: <span className="swatch fill-late" aria-hidden="true" /> },
  { label: 'In transit', symbol: <span className="swatch fill-transit" aria-hidden="true" /> },
  {
    label: 'Stack',
    symbol: (
      <Icon>
        <rect x="6" y="1" width="10" height="14" {...stroke} />
        <path d="M6 5h10M6 9h10M6 13h10" {...stroke} />
      </Icon>
    ),
  },
  {
    label: 'Backorder',
    symbol: (
      <Icon>
        <rect x="3" y="2" width="16" height="12" {...stroke} strokeDasharray="2.5 2" />
      </Icon>
    ),
  },
  {
    label: 'Store',
    symbol: (
      <Icon>
        <circle cx="11" cy="8" r="6.5" {...stroke} />
      </Icon>
    ),
  },
  {
    // Matches mapShapes.ts: lateBeadGeometry (ring, inner radius 0.5). On-time orders get no dot (D-013).
    label: 'Late order day',
    note: 'size = orders that day',
    symbol: (
      <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
        <circle cx="11" cy="8" r="5.25" fill="none" stroke="var(--late)" strokeWidth="3.5" />
      </svg>
    ),
  },
  {
    label: 'Destination',
    symbol: (
      <Icon>
        <circle cx="11" cy="8" r="6.5" {...stroke} />
        <circle cx="11" cy="8" r="1.8" fill="currentColor" />
      </Icon>
    ),
  },
  {
    label: 'Warehouse',
    symbol: (
      <Icon>
        <circle cx="11" cy="8" r="7" {...stroke} />
        <circle cx="11" cy="8" r="4" {...stroke} />
        <circle cx="11" cy="8" r="1.6" fill="currentColor" />
      </Icon>
    ),
  },
]

export default function Legend() {
  return (
    <footer className="legend" aria-label="Legend">
      <ul>
        {ITEMS.map(({ label, symbol, note }) => (
          <li key={label}>
            {symbol}
            {label}
            {note && <span className="legend-note">{note}</span>}
          </li>
        ))}
      </ul>
      <ThemeToggle />
    </footer>
  )
}
