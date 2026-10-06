# Software design — Cargo Atlas

How the app is put together. The spec (`docs/prompt-design.md`) says **what** to build; this file
records **how** and **why**, and the decisions made along the way. Rules that must never break live
in `CLAUDE.md`.

## Shape of the system

```
Browser (client scene, tables, forms)
   │  fetch POST /api/*  (same origin only, checked in proxy.ts)
   ▼
Next.js server (route handlers + server views in features/<x>/server)
   │  requireMember() → orgId, role      every query filtered by orgId
   ▼
platform/*Repo.ts  ──►  Supabase (service role)  ──►  Postgres functions
                                                     apply_movement, ship_shipment,
                                                     add_event, ack_shipment, import_batch
```

- The browser never talks to Supabase. RLS is on with no policies; only the service role can read or
  write, and only from `platform/`.
- Stock is a ledger (`stock_movements`); `stock_levels.on_hand` is a cache written only by
  `apply_movement()`, which refuses to go below zero.
- Pages load data on the server with one `now` per request and pass it down, so server render, the
  scene and the alerts agree on every delay status.

## Layers

`app → features → engine | platform | ui | config → domain`, enforced by `eslint.config.mjs`
(`arch/*`). See the table in `CLAUDE.md`.

| Layer | Why it is separate |
|-------|--------------------|
| `domain/` | All business rules (delay, progress, stock, map math) are pure and tested without a browser, database or clock. |
| `platform/` | One place that knows about Supabase; swapping or mocking the database touches only this folder. |
| `engine/` | 3D building blocks with no data access, reusable across features. |
| `features/<x>/` | Each screen's code in one folder; features meet only in `app/_experience/Experience.tsx` through slots and callbacks. |

## The scene

- 1 scene unit = 1 degree; equirectangular projection (`x = lng`, `z = −lat`). Sizes in `MAP`.
- US land is baked once into a 0.25° grid plus state outlines (`public/map/us.json`) and drawn as
  one instanced mesh plus one line draw.
- Trucks (two meshes), pins and land are instanced; one shared clock uniform drives pulsing.
- Motion is a pure `step(state, dt)` in `domain/`, called from `useFrame` in a feature hook, so it is
  tested frame by frame instead of with screenshots.
- Positions are estimates unless the latest event has lat/lng; the UI says so.

## Theme

`ui/theme.ts` (for Three.js) and `ui/tokens.css` (Tailwind `@theme`) hold the same palette; a test
keeps them equal. Delay-status colours: `statusOnTime`, `statusAtRisk`, `statusLate`,
`statusDeliveredLate`. No hex colour lives anywhere else.

## Fonts

Silkscreen (titles, buttons) and Space Grotesk (body, tables), latin subset, self-hosted in
`public/fonts` (SIL OFL 1.1, licence files alongside) and loaded with `next/font/local` in
`app/layout.tsx` as `--font-silkscreen` / `--font-space-grotesk`.

## Decision log

| Date | Decision | Why |
|------|----------|-----|
| 2026-10-05 | `AGENTS.md` holds Next's managed agent block; `CLAUDE.md` holds project rules. | `next dev` inserts its block into `CLAUDE.md` when no `AGENTS.md` exists; keeping them apart keeps `CLAUDE.md` short. |
| 2026-10-05 | Lint bans every `../` import, not just `../../`. | A single `../` can step out of a feature folder and bypass the layer rules. |
| 2026-10-05 | The "Simulated data" tag lives in the root layout. | Rule 15: visible on every screen without each page remembering it. |
| 2026-10-05 | Domain times are UTC epoch ms (`domain/time.ts`); `parseIso` refuses times without a zone. | Plain numbers cross server → client unchanged; a zoneless time would be read in the machine's zone. |
| 2026-10-05 | Low stock = on hand ≤ reorder point; out = 0 on hand; reorder point 0 = never low. | Usual meaning of a reorder point; the spec says "below" without saying strict. |
| 2026-10-05 | Movement sign checks: received/returned > 0, shipped < 0 and needs a shipment id; adjusted/counted either way. | Catches a mistyped sign in the movement form before it reaches the ledger. |
| 2026-10-06 | The map page uses `await connection()` instead of `dynamic = "force-dynamic"`. | Next 16 docs drop `dynamic` from route-segment config (removed under Cache Components); `connection()` is the documented way to render per request. |
| 2026-10-06 | `.gitignore` also covers keys, certificates, Supabase/Vercel local state and DB dumps. | Secrets for Supabase, Resend and Vercel arrive from M3 on; nothing sensitive may reach a remote. |
| 2026-10-05 | `deliveredAt` comes from the first `delivered` scan; ETA from the latest event that carries one. | Events arrive out of order; everything is decided by `at`. |
| 2026-10-06 | The map is the US lower 48 + DC, and shipments ride **trucks**: one per warehouse + state + UTC ship day, coloured by its worst open order, with a count badge. Arcs, drones and the date-line rule are gone. | Owner's call: one truck carrying a state's daily load reads better than hundreds of drones. Orders stay separate shipments for alerts and cards. |
| 2026-10-06 | Loading trucks park on a dock pad over the sea beside the warehouse, with one label. | ~45 loading trucks in a yard on land covered NY/PA and their badges overlapped. |
| 2026-10-06 | Demo delays come by truck (1 in 20 held at a hub), not per order; generated orders all ship next day. | With "worst status wins", per-order delays (or the spec's 3 % slow handling) painted every big truck red or amber. |
| 2026-10-06 | Truck positions are always estimates; a scan position is shown only on a single order's card. | A truck stands for many parcels; rule 9 stays true for the order. |
| 2026-10-06 | Pins are one per state at its anchor; the 0.5° pin merge is gone. | Every order goes to its state's anchor ± 0.3°, so merging only rebuilt the state grouping. |
| 2026-10-06 | Each state has one anchor (main city), nudged inland where the 0.25° grid puts it in water (Milwaukee). | A test keeps every truck stop on land. |

## Open questions for the owner

Left as `TODO(owner)` in code, using the spec defaults until answered:

- Business days or calendar days for the SLA (default: calendar).
- Per-destination or per-carrier SLAs (default: 7 days).
- Split shipments across warehouses (default: one shipment leaves one warehouse).
- `returned` shipments: today they follow the not-delivered rules and become late
  (`TODO(owner)` in `domain/ship/delay.ts`). Likely they should leave the alerts list.
