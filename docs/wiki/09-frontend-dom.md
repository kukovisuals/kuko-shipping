# Frontend DOM

> **Owner:** Frontend · **Status:** Built (M6, M9 DOM half) · **Last updated:** 2026-10-07

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
| `Legend` | Every symbol and fill on the page. "Late order day" is the accent ring (size = orders that day); there is no symbol for on-time orders because the map draws none (D-013) | Static |
| `WeekControl` | "Play week" / "Pause" button and a Mon-Sun day counter, bottom-left of the map | Store: `weekPlaying`, `weekDay` |

![React components placed on the page](img/fig-components.svg)


## Built in M6
`Header`, `Total`, `Sidebar`, `LateList`, `Legend` render real API data (code in `components/dom/`). `Bar` is the shared proportional bar; `ThemeToggle` (in the Legend row) switches Light/Dark, which only recolours the one design.

`PipelineLabels.tsx` holds the small text pieces beside the stacks (`StackCount`, `RegionName`, `StageTitle`, `FlowNote`, `CircleLabel`); the 3D scene places them with drei `<Html>`.

## Built in M9 (DOM half)
- `RegionCard` (`name, count, onTime, late, dimmed?`): plain props; 3D pins it over each region and passes `dimmed` for every region except the selected one (opacity .35, 300 ms).
- `StoreButton` (in `PipelineLabels.tsx`): the Store circle as a real button, wired to `pipelineCollapsed` (callout ①). 3D must pin it with pointer events on.
- Numbered hints: `①` on the Store button, `②` above the sidebar rows.
- `useCloseOnEscape()` (in `LateList`): Escape clears `selectedRegion`. Tab and Enter work because sidebar rows are buttons.
- `usePrefersReducedMotion()` for 3D animation; CSS drops all transitions under `prefers-reduced-motion`.

**Pipeline hidden for now:** `app/page.tsx` has `SHOW_PIPELINE = false`. The pipeline's 3D scene fits itself into the `.pipeline` cell, so without the cell the stacks, labels and the Store button (callout ①) do not draw. Set it to `true` to bring them back. `.map` has a `min-height` so the map keeps its size without that column.

## Week replay (design update)
`WeekControl` flips `weekPlaying` and highlights `weekDay` while playing. It starts paused, so the page is still by default, and it is not rendered at all with reduced motion. The clock lives in 3D (wiki 11); the DOM never moves anything.

**Waiting on 3D:** mounting `RegionCard` and `StoreButton`, the collapse animation, and the map fade (see `docs/handoffs.md`).

## Shared state (zustand)
```ts
{
  selectedRegion: 'WEST' | 'MIDWEST' | 'NE' | 'SOUTH' | null
  pipelineCollapsed: boolean
  weekPlaying: boolean   // DOM writes (button); 3D reads
  weekDay: number        // 0-6 (Mon-Sun); 3D writes when the day changes; DOM reads
}
```
DOM and 3D both read this store. That's how a sidebar click can highlight a region on the map.

![Shared zustand store: sidebar and Escape write selectedRegion, Store click writes pipelineCollapsed; LateList, map and stacks read](img/fig-shared-state.svg)


## Data fetching
Code: `lib/hooks/useEndpoint.ts` (one fetch and one timer per URL, shared by every component; a module-level store, so the 3D Canvas can read it too), with `useSummary()` and `useLateOrders(region)` on top. Response types: `lib/hooks/types.ts`.
- One small hook per endpoint (e.g. `useSummary()`).
- Fetch on mount, then re-fetch on the refresh timer (OPEN-07).
- Show the last good data during a re-fetch. Never flash empty.

## Visual rules (from Design Spec)
- State words appear only in `Legend`.
- Bars: same length, split by ratio. Width = count ÷ total.
- Every fill has a pattern as well as a color (solid, hatched, dotted).
- Numbers in a monospace font, so digits line up.

## Shared tokens
`tokensCss()` turns `lib/tokens.ts` into CSS variables, injected by `app/page.tsx`. Colors and fills live in one file (`lib/tokens.ts`). CSS and the 3D materials both import from it, so the DOM and the map always match.

## Accessibility
- Sidebar rows are buttons, reachable by keyboard.
- Each bar has an `aria-label`, e.g. "West: 600 on time, 150 late."

## Depends on
[API](08-api.md) · [Design Spec](01-design-spec.md)
