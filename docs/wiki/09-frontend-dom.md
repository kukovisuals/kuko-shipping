# Frontend DOM

> **Owner:** Frontend · **Status:** Proposed · **Last updated:** 2026-10-07

## Purpose
The React (non-3D) parts of the page.

## Components

| Component | Shows | Data |
|-----------|-------|------|
| `Header` | Title "How many orders are late for delivery?" | Static |
| `Total` | Big count, one proportional bar, two counts | `/api/summary` → `total` |
| `RegionCard` | Name, count, bar, two counts (sits over the map via drei `<Html>`) | `/api/summary` → `regions` |
| `Sidebar` | One row per region: name, bar, late count | `/api/summary` → `regions` |
| `LateList` | Order number, city, "+Nd", then "+ N more" | `/api/regions/[region]/late` |
| `PipelineLabels` | Stage names and counts beside the 3D stacks | `/api/pipeline` |
| `Legend` | Every symbol and fill on the page | Static |

![React components placed on the page](img/fig-components.svg)


## Shared state (zustand)
```ts
{
  selectedRegion: 'WEST' | 'MIDWEST' | 'NE' | 'SOUTH' | null
  pipelineCollapsed: boolean
}
```
DOM and 3D both read this store. That's how a sidebar click can highlight a region on the map.

![Shared zustand store: sidebar and Escape write selectedRegion, Store click writes pipelineCollapsed; LateList, map and stacks read](img/fig-shared-state.svg)


## Data fetching
- One small hook per endpoint (e.g. `useSummary()`).
- Fetch on mount, then re-fetch on the refresh timer (OPEN-07).
- Show the last good data during a re-fetch. Never flash empty.

## Visual rules (from Design Spec)
- State words appear only in `Legend`.
- Bars: same length, split by ratio. Width = count ÷ total.
- Every fill has a pattern as well as a color (solid, hatched, dotted).
- Numbers in a monospace font, so digits line up.

## Shared tokens
Colors and fills live in one file (`lib/tokens.ts`). CSS and the 3D materials both import from it, so the DOM and the map always match.

## Accessibility
- Sidebar rows are buttons, reachable by keyboard.
- Each bar has an `aria-label`, e.g. "West: 600 on time, 150 late."

## Depends on
[API](08-api.md) · [Design Spec](01-design-spec.md)
