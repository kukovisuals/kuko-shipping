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
- Land is baked once into a 1° grid (`public/map/land.json`) and drawn as one instanced mesh.
- Drones, pins and land are instanced; one shared clock uniform drives pulsing.
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
| 2026-10-05 | `arcPoint` uses the closed form of the spec's Bézier (linear ground track + `y = 4h·t(1−t)`), clamped to the endpoints. | The expanded formula rounds past ±180 at the map edge; a test proves both forms agree. |
| 2026-10-05 | Pins merge transitively (any two points < 0.5° apart join), using a 0.5° grid. | Greedy "join the first pin" split one city's orders into several pins depending on order. |
| 2026-10-05 | Low stock = on hand ≤ reorder point; out = 0 on hand; reorder point 0 = never low. | Usual meaning of a reorder point; the spec says "below" without saying strict. |
| 2026-10-05 | Movement sign checks: received/returned > 0, shipped < 0 and needs a shipment id; adjusted/counted either way. | Catches a mistyped sign in the movement form before it reaches the ledger. |
| 2026-10-06 | The map page uses `await connection()` instead of `dynamic = "force-dynamic"`. | Next 16 docs drop `dynamic` from route-segment config (removed under Cache Components); `connection()` is the documented way to render per request. |
| 2026-10-06 | `.gitignore` also covers keys, certificates, Supabase/Vercel local state and DB dumps. | Secrets for Supabase, Resend and Vercel arrive from M3 on; nothing sensitive may reach a remote. |
| 2026-10-05 | `deliveredAt` comes from the first `delivered` scan; ETA from the latest event that carries one. | Events arrive out of order; everything is decided by `at`. |

## Open questions for the owner

Left as `TODO(owner)` in code, using the spec defaults until answered:

- Business days or calendar days for the SLA (default: calendar).
- Per-destination or per-carrier SLAs (default: domestic 7 days, international 14).
- Split shipments across warehouses (default: one shipment leaves one warehouse).
- `returned` shipments: today they follow the not-delivered rules and become late
  (`TODO(owner)` in `domain/ship/delay.ts`). Likely they should leave the alerts list.
