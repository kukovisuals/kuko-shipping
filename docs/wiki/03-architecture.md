# Architecture

> **Owner:** Tech Lead · **Status:** Accepted · **Last updated:** 2026-10-07

## Purpose
The stack, the layers, and the one rule about data flow.

## Stack

| Layer | Tool |
|-------|------|
| App framework | Next.js (App Router), TypeScript |
| 3D | three, @react-three/fiber, @react-three/drei |
| UI state | zustand |
| Database | PostgreSQL |
| ORM | Prisma |
| Map geometry | us-atlas, topojson-client, d3-geo |
| Unit tests | Vitest |
| End-to-end tests | Playwright |

## Layers

![Architecture: seed or Shopify fills raw fields; the Status Engine job writes derived fields; API reads derived fields; browser fetches JSON](img/fig-architecture.svg)
*The dashed line is the data-flow rule. Above it, code only displays. Below it, all status logic.*

<details><summary>Plain-text version</summary>

```
Browser
  ├─ DOM panels (React)      ← title, total, sidebar, list, legend
  └─ R3F Canvas              ← map, lanes, dots, stacks, warehouse
        ▲
        │ fetch JSON (on load + timer)
        │
Next.js API routes (app/api/*)
        ▲
        │ reads derived status
        │
Status Engine (lib/status-engine)
        ▲
        │ raw orders + shipments + events
        │
PostgreSQL (Prisma)
        ▲
        │ Phase 1: seed script   |   Phase 2: Shopify sync job
```
</details>

## The data flow rule
**Components never compute status.**
They only display what the API returns. All stage and timing logic lives in the Status Engine. One place to test, one place to fix.

## Render split: DOM vs R3F

![Render split on the page: text zones are DOM, map and stacks are R3F](img/fig-render-split.svg)
*Solid outline = DOM. Dashed outline = R3F canvas.*

- **R3F:** anything spatial or animated — map, region shapes, lanes, dots, destinations, warehouse, stacks.
- **DOM:** anything that's text or a list — title, Total, region cards, sidebar, late list, legend.
- Reason: WebGL is weak at text, selection, and accessibility. The DOM is strong at all three.
- Region cards sit over the map using drei `<Html>`, so they stay real DOM.

## Refresh model
- Data loads on page open.
- The client re-fetches on a timer. Interval: OPEN-07 (default 5 minutes).
- No webhooks in v1.

## Folder structure

```
app/
  page.tsx                  ← layout: header, 3 columns, legend
  api/
    summary/route.ts
    pipeline/route.ts
    lanes/route.ts
    regions/[region]/late/route.ts
components/
  dom/                      ← Header, Total, Sidebar, LateList, Legend
  three/                    ← Scene, UsMap, Lanes, Stacks, Warehouse
lib/
  status-engine/            ← pure functions + tests
  db.ts                     ← Prisma client
  regions.ts                ← state → region mapping
prisma/
  schema.prisma
  seed.ts
```

## Depends on
[Setup](04-setup.md) · [Status Engine](07-status-engine.md) · [API](08-api.md)
