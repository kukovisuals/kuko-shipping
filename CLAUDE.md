# CLAUDE.md — Cargo Atlas

A private 3D map of the US (lower 48 + DC) for one e-commerce company: warehouses, and trucks
carrying each day's orders to each state, coloured by their worst order's delay status, an Alerts panel for late/at-risk shipments, and a stock
table per product variant per warehouse. Desktop first, works at 375 px.

**This build is a concept demo for Death Wish Coffee. All brand data is simulated.** Brand name as
text only: no logos, skull artwork or product photos. A "Simulated data" tag is visible on every screen.

The full spec is `docs/prompt-design.md`. Read the relevant section before changing behaviour. When
a big rule or lesson changes, update the spec and this file in the same commit.

## Commands

```bash
npm run dev          # next dev
npm run build        # next build
npm run lint         # eslint (includes arch/* layer rules)
npm test             # vitest run
npm run typecheck    # next typegen && tsc --noEmit
npm run bake:land    # tsx scripts/bakeLand.ts → public/map/us.json (needs scripts/data/ne_50m_admin_1_*)
npm run seed:demo    # tsx scripts/seedDemo.ts (fixed seed 4242, dates relative to today)
```

After every milestone or meaningful change: typecheck, test, lint, build — all must pass before commit.
Commit messages start with the milestone/ticket id (e.g. `M3: seed demo data`).

## Stack

- Next 16.3 (App Router, **`proxy.ts`, not `middleware.ts`**), React 19.2, TypeScript 5 strict
- three 0.186, @react-three/fiber 9.8, drei 10.7, postprocessing 3.1
- Supabase (supabase-js 2.117, @supabase/ssr 0.12) — two projects: staging and production
- Tailwind 4 (@tailwindcss/postcss), ESLint 9 + eslint-config-next 16
- Vitest 3 + jsdom + Testing Library; Vercel hosting + @vercel/analytics; Resend SMTP for auth email
- Fonts self-hosted in `public/fonts`: Silkscreen (titles/buttons), Space Grotesk (body/tables)
- `@/*` → `./*` (no `src/`). Vitest: `environment: "node"`; component tests add
  `// @vitest-environment jsdom` at the top.

**Next 16 differs from training data.** Read `node_modules/next/dist/docs/` before any Next.js work.
`proxy.ts` exports `proxy` and a static `config.matcher`. Restart `next dev` after adding a `[param]` folder.

## Architecture

```
app → features → engine | platform | ui | config → domain
```

| Folder | Holds | May import | Never |
|--------|-------|------------|-------|
| `domain/` | Rules, formulas, types. Pure TS, test next to each file. Time rules take `now`. | other `domain/` | React, Three, Next, Supabase, `Date.now()` |
| `ui/` | `theme.ts` + `tokens.css` (a test keeps them equal) | nothing in the project | — |
| `config/` | Public settings (limits, defaults) | `domain/` | features, app, engine, platform |
| `platform/` | Supabase clients, one `*Repo.ts` per table, `http.ts`, `auth.ts`, `org.ts`. Starts with `import "server-only"`. | `domain/`, `config/` | React, features, app, engine |
| `engine/` | Reusable 3D pieces: land, lines, dock, warehouse, trucks, pins, labels, effects | `domain/`, `ui/`, `config/` | features, app, platform |
| `features/<x>/` | One feature's client code, public API in `index.ts` | own folder, `domain`, `engine`, `ui`, `config` | other features, `app/`, `platform/` |
| `features/<x>/server/` | Route handlers + server views, API in `server/index.ts` | + `platform/` | other features, `app/` |
| `app/` | Routes/pages; imports features only via `@/features/<x>` or `@/features/<x>/server` | anything | feature internals |

- `app/api/**/route.ts` is one line: `export { movementPOST as POST } from "@/features/inventory/server";`
- No `../` imports (lint-enforced) — always `@/…`; `./` siblings are fine.
- Features talk through callback/slot props wired in `app/_experience/Experience.tsx`
  (e.g. the shipment card's `action` slot holds the alerts feature's "Acknowledge" button).
- ESLint `arch/*` `no-restricted-imports` blocks enforce the layers. **Never silence a boundary
  error; move the code.**

### Server patterns

- `platform/supabase.ts`: `adminClient()` (service role, all reads/writes), `authClient()` (cookie
  session), `refreshAuthSession(request)` for `proxy.ts`.
- `platform/db.ts`: `run(what, query)` returns data or throws `"<what> failed: …"`; retries once
  after 1 s on "JWT issued at future".
- `platform/http.ts`: `readJson`, `ok(extra)`, `fail(error, status, fields?)`.
  Replies: `200 { ok: true, … }` or `{ error, fields? }` with 400/401/403/404/409/429/502.
- `platform/auth.ts`: `currentUser()` → `{ id, email }` only for confirmed emails (`getUser()`).
- `platform/org.ts`: `requireMember(userId, role?)` → `{ orgId, role }` or 403. Every server view and
  route calls it and filters every query by that `orgId`.
- Pages load data on the server and pass it to the client scene. `dynamic = "force-dynamic"` on map,
  inventory and alerts pages. The map refetches every 60 s and on window focus.

## Rules that must never break

1. Stock changes only through `apply_movement()`. `on_hand` is never written any other way.
2. `on_hand` never goes below zero. A refused movement is a 409 to the user.
3. A shipment takes stock once (`ship_shipment()` is idempotent; the ledger has a unique key).
4. Every query is filtered by the caller's `org_id` from `requireMember()`. No exceptions.
5. All reads and writes go through server routes with the service role. The browser never talks
   to the database.
6. `viewer` reads only. `staff` adds movements, events, imports and acks. `owner` also edits
   settings, warehouses and members.
7. Never store a customer's name, email, phone or street address. Destination = city, region,
   country, lat, lng.
8. Every time rule lives in `domain/ship/` and takes `now`. The server passes one `now` per request.
9. A truck's position is always an **estimate** ("Estimated position" on its card); a single order's
   position is an estimate unless its latest event has lat/lng.
10. Imports are idempotent: the same CSV twice changes nothing.
11. Only confirmed emails count as signed in. Login/forgot-password never reveal whether an email
    has an account. No public sign-up; the owner invites members.
12. `proxy.ts` answers 403 to a `POST /api/*` whose `Origin` host differs from `Host`; security
    headers as in Central Meetup; every redirect goes through `safeNext`.
13. Never hard-code a warehouse id, an org id or a hex colour outside `ui/theme.ts` / `ui/tokens.css`.
14. Never hard-code secrets; never commit `.env.local`; nothing in progress touches production.
15. Simulated data only. "Simulated data" tag on every screen; no real brand logo or artwork in the repo.

## Data (Supabase)

- Migrations in `supabase/migrations/NNNN_name.sql`, one per change; additive only once in
  production (rename/drop takes two releases). `0001_init.sql` holds the initial schema (spec §7).
- Every table has `org_id` (except `organisations`), RLS enabled, all revoked from anon/authenticated,
  no policies, no public views.
- DB functions are `security definer`, `set search_path = ''`, granted to service_role only:
  `apply_movement`, `ship_shipment`, `add_event`, `ack_shipment`, `import_batch`.
- Store all times in UTC; count days in UTC; display in the company time zone (America/New_York).
- Events can arrive out of order: status follows the latest `at`, never arrival order.

## Domain rules (tested in `domain/`)

- **Map:** 1 scene unit = 1°. `x = lng`, `z = −lat`, Y up. US only: lower 48 + DC, 0.25° land grid,
  one anchor city per state (`domain/map/usStates.ts`; a test keeps every anchor on land). Routes are
  straight ground lines warehouse → anchor. One pin per state. Sizes live in `MAP`.
- **Trucks** (`domain/ship/trucks.ts`): one per warehouse + state + UTC ship day; unshipped orders
  ride the state's loading truck on the dock. Colour = worst open order (late > at_risk > on_time);
  a truck with no open orders is not drawn. Demo delays come by truck, never sprinkled per order.
- **Delay** (`domain/ship/delay.ts`): `promised = promised_at ?? placed_at + sla_days`. Delivered →
  `on_time` / `delivered_late`. Otherwise, first match: `late` (now > promised) → `at_risk`
  (exception, inside risk window, stalled > stall_hours, unshipped > handling_days) → `on_time`.
  `days_late = ceil((ref − promised)/day)`. Remaining = `carrier_eta_at − now` or `null`
  ("No carrier ETA") — never invent a remaining time. Every result carries a `reason` string.
- **Progress** (`domain/ship/progress.ts`, `trucks.ts`): loading 0; on the road
  `clamp((now − departed)/(latest open promise − departed), 0, 0.95)`; late trucks hold at 0.95
  and pulse; a truck fades when its last order is delivered.
- **Alerts sort:** `late` by days late desc, then `at_risk`, then by order date.

## 3D scene and React

- One `<Canvas>` in `app/_experience/Experience.tsx`; `MapControls` tilt 20°–70°; bloom on emissive
  parts only.
- Instanced meshes for land, trucks and pins; one shared clock uniform, not per-mesh `useFrame`.
- Phone budget: DPR ≤ 1.25, no shadows, ≥ 30 fps; desktop DPR ≤ 2, ≥ 55 fps. Cap 2,000 trucks
  (show late + at-risk, count the rest); count badges ≤ 40. `prefers-reduced-motion`: no motion, no pulsing.
- Motion = pure `step(state, dt)` in `domain/` + a hook in `features/` calling it from `useFrame`.
  Prove motion with `step()` tests via `renderHook`, not screenshots (automated Chrome is throttled).
- `useEffect` only to sync with the outside world; derived values in render/`useMemo`; latest-callback
  refs use `useEffectEvent`.
- Use drei `Text` with the self-hosted font, not drei `Html` (React 19 unmount error).
- Seed every random value drawn on both server and browser, or hydration differs.
- Status colours: `on_time` cyan, `at_risk` amber, `late` red, `delivered_late` dim red — from the theme.
- Trucks are plain boxes (cargo + cab), no wheels or logos.

## Testing

- Every domain rule gets a test next to it. Cover truck grouping (worst status wins), "no carrier
  ETA", out-of-order events, and an order placed at 23:30 local time.
- Never call `Date.now()` in render or in `domain/`; pass `now` in.

## Working rules

- Build milestones M0–M9 from spec §11 in order (M9 Shopify is skipped for this build). Tickets live
  in `docs/tickets.md`; design notes in `docs/software-design.md`; flow in `docs/workflow.md`.
- Workflow: local (staging DB) → `staging` branch → owner OK → migration on production → `main`.
- Stop and ask only for things outside the folder: Supabase/Vercel projects, `.env.local` keys, SQL
  to paste (give the file, the **project name** and the editor link — never production before
  release), the Natural Earth files (`scripts/data/`), email setup, or a real-phone check.
- Don't decide open owner questions (business vs calendar days, per-destination SLAs, split
  shipments): leave `TODO(owner)` and use the spec defaults.
- Uploads capped at 4 MB (Vercel limit 4.5 MB); CSV ≤ 5,000 rows.
- If the same fix fails 3 times, stop and report what was tried.
