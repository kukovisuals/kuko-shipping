# Prompt design — build a 3D shipping and inventory tracker from one prompt

This file lets you start a new app from **one prompt**: a 3D flat world map that shows an
e-commerce company's warehouse, its shipments flying to customers, which ones are late and by how
much, and a stock count for every product and variant. It holds the prompt, the spec the prompt
points to, the build order, and the lessons carried over from Central Meetup.

This build is a **concept demo for Death Wish Coffee**. Every number about the brand in §3a is
simulated. Nothing here is real company data.

Keep it current: when a big rule or lesson changes here, update this file in the same commit.

---

## 1. How to use it

1. Make an empty folder and `git init` it.
2. Copy the **kit** into it (same paths):

   | File | Why |
   |------|-----|
   | `docs/prompt-design.md` (this file) | The spec and build order. Enough on its own. |
   | `eslint.config.mjs` | The layer rules from Central Meetup. The layers are the same, so it works as is. |
   | `ui/theme.ts`, `ui/tokens.css` | Optional. The night-neon palette. Add the status colours in §10. |

3. Fill in the sheet in §3 (or keep the defaults). For this build it is already filled in.
4. Open Claude Code in the folder and paste the prompt from §2.

Claude stops only for what it can't do itself: making the Supabase and Vercel projects, pasting
keys into `.env.local`, running SQL in the Supabase editor, getting the land-map source file if the
download is blocked, and checking things on a real phone.

---

## 2. The prompt

Copy everything inside the box. Replace each `{…}` with your answer from §3.

```text
Build a new web app in this folder. The full spec is docs/prompt-design.md: read all of it first.
Follow it exactly. Where it names "Cargo Atlas", use my values below.

My values:
- Product name: {PRODUCT_NAME}, domain {DOMAIN}
- Demo client: {DEMO_CLIENT}
- Warehouses at launch: {WAREHOUSES}
- Shipping promise: {SLA_RULE}
- Where orders and shipments come from: {DATA_SOURCE}
- Where tracking updates come from: {TRACKING_SOURCE}
- The moving object: {CARGO}
- Look: {ART_DIRECTION}
- Sign-in: {SIGN_IN}
- Leave out: {LEAVE_OUT}

How to work:
1. Read node_modules/next/dist/docs/ for anything Next.js: this Next version differs from your
   training data. Use proxy.ts, not middleware.ts.
2. First write CLAUDE.md (rules + commands + layer table, using §8 and §6 of the spec),
   docs/software-design.md, docs/tickets.md (milestones M0–M9 of §11 as tickets with "Done when"
   lines) and docs/workflow.md. Show me CLAUDE.md and the ticket list, then keep going without
   waiting unless I object.
3. Build the milestones in order. After each one run typecheck, test, lint and build, fix what
   fails, commit (message starts with the milestone id), and move on.
4. Stop and ask me only when you need something outside this folder: Supabase or Vercel projects,
   keys for .env.local, SQL to paste in the Supabase editor (give me the file, the project name and
   the editor link), the land-map source file, email setup, or a real-phone check.
5. Every domain rule gets a test next to it. Every time rule takes `now` as an argument.
   Prove motion with step() tests, not screenshots.
6. Never put a secret in code, never commit .env.local, never hard-code a warehouse id or a hex
   colour outside the theme files, never store a customer's name, email or street address.
7. If the same fix fails 3 times, stop and tell me what you tried.
When all milestones pass, give me a short report: what works, what I must test by hand, and what
is left open.
```

---

## 3. Fill-in sheet

| Placeholder | Value for this build (Death Wish demo) |
|-------------|----------------------------------------|
| `{PRODUCT_NAME}`, `{DOMAIN}` | Cargo Atlas, cargoatlas.app |
| `{DEMO_CLIENT}` | Death Wish Coffee, simulated data only (see §3a). Concept demo, not affiliated with the brand. Use the brand name as text only: no logos, skull artwork or product photos. A small "Simulated data" tag stays visible on every screen. |
| `{WAREHOUSES}` | One warehouse: `W01` "Upstate NY Roastery & Fulfilment", Round Lake, NY, US, lat 42.94, lng −73.80 (assumed location). The schema allows many from day one. |
| `{SLA_RULE}` | Domestic (US) orders: promised = order date + 7 calendar days. International orders carry their own promised date = order date + 14 days. Editable per company in Settings. |
| `{DATA_SOURCE}` | Demo seed built from §3a + CSV import. No Shopify sync: M9 is skipped. |
| `{TRACKING_SOURCE}` | Seeded status events (§3a), plus events entered by hand or by CSV. No carrier-tracking API. |
| `{CARGO}` | A small box-built cargo drone per shipment, coloured by its delay status. |
| `{ART_DIRECTION}` | Night neon: deep navy sea, dark voxel land, cyan routes, neon pink accent, bloom on emissive parts only. Cubes and thin lines. No gradients or rounded corners. |
| `{SIGN_IN}` | Email + password through Supabase Auth. Confirmed emails only. Members of the company only. |
| `{LEAVE_OUT}` | Payments, customer notifications, returns flow, route optimisation, demand forecasting, AI features, a multi-company UI, live carrier sync, subscription management, any real brand artwork. |

---

## 3a. Demo client data — Death Wish Coffee (simulated)

`scripts/seedDemo.ts` builds the demo from this section. All of it is made up to look believable.
Use one fixed random seed (`4242`) so every run makes the same data.

### Company

| Field | Value |
|-------|-------|
| `name` | Death Wish Coffee (demo) |
| `sla_days` | 7 |
| `risk_window_hours` | 24 |
| `stall_hours` | 48 |
| `handling_days` | 2 |
| Time zone for display | America/New_York |

### Catalog (12 products, 36 variants)

SKU pattern: `DW-<PRODUCT>-<OPTION>`. Grind codes: `WB` whole bean, `GR` ground.
Stock is at `W01`. "Units" are bags, boxes, cans or items.

| Product | Variants (SKU suffix) | On hand per variant | Reorder point | Sales weight |
|---------|-----------------------|---------------------|---------------|--------------|
| Dark Roast (signature) | WB-1LB, GR-1LB, WB-2LB, GR-2LB, WB-5LB, GR-5LB | 400–1,200 | 150 | 30 % |
| Medium Roast | WB-1LB, GR-1LB, WB-2LB, GR-2LB | 200–600 | 80 | 12 % |
| Espresso Roast | WB-1LB, GR-1LB, WB-2LB, GR-2LB | 150–500 | 60 | 9 % |
| Organic Light Roast | WB-1LB, GR-1LB | 80–250 | 40 | 4 % |
| Fall Seasonal Blend (limited) | WB-12OZ, GR-12OZ | 20–60 | 30 | 6 % |
| Dark Roast Pods | 10CT, 24CT, 50CT | 300–900 | 120 | 15 % |
| Medium Roast Pods | 10CT, 24CT | 150–400 | 60 | 6 % |
| Instant Coffee Sticks | 8CT, 24CT | 100–300 | 50 | 5 % |
| Cold Brew Cans | 4PK, 12PK | 120–350 | 60 | 5 % |
| Logo Mug | BLK-16OZ, BLK-20OZ, WHT-16OZ | 60–200 | 25 | 4 % |
| Logo T-Shirt (black) | S, M, L, XL, 2XL | 20–90 | 15 | 3 % |
| Pour-Over Brewer Kit | STD | 30–80 | 10 | 1 % |

Seed the ledger, not `stock_levels`: one `received` movement per variant for the starting stock,
then `shipped` movements from the seeded shipments.

**Stock stories the demo must show** (set them on purpose after the random seed):

- Fall Seasonal Blend `GR-12OZ` is **out of stock** (0 on hand) → warehouse ring turns red.
- Fall Seasonal Blend `WB-12OZ` and Dark Roast Pods `50CT` are **below reorder point** → amber.
- Logo T-Shirt `2XL` is **out of stock**.

### Orders (300 over the last 30 days)

- Order numbers: `DW-100001` upward. About 35 % are subscription-style repeats: same destination
  every ~30 days, order number prefix `DW-SUB-`. They are normal orders; there is no subscription
  table.
- Volume: 8–14 orders a day, a bit higher on Mondays and the 1st of the month.
- Lines per order: 1 line (60 %), 2 lines (30 %), 3 lines (10 %). Qty 1 (80 %) or 2 (20 %).
  Pick variants by the sales weights above.

### Destinations (city-level only, never a street)

| City | Country | lat | lng | Share |
|------|---------|-----|-----|-------|
| New York, NY | US | 40.71 | −74.01 | 12 % |
| Los Angeles, CA | US | 34.05 | −118.24 | 9 % |
| Chicago, IL | US | 41.88 | −87.63 | 7 % |
| Boston, MA | US | 42.36 | −71.06 | 7 % |
| Denver, CO | US | 39.74 | −104.99 | 6 % |
| Houston, TX | US | 29.76 | −95.37 | 5 % |
| Philadelphia, PA | US | 39.95 | −75.17 | 5 % |
| Dallas, TX | US | 32.78 | −96.80 | 5 % |
| Seattle, WA | US | 47.61 | −122.33 | 5 % |
| Atlanta, GA | US | 33.75 | −84.39 | 5 % |
| Phoenix, AZ | US | 33.45 | −112.07 | 4 % |
| Miami, FL | US | 25.76 | −80.19 | 4 % |
| Minneapolis, MN | US | 44.98 | −93.27 | 4 % |
| Nashville, TN | US | 36.16 | −86.78 | 4 % |
| Portland, OR | US | 45.52 | −122.68 | 4 % |
| Austin, TX | US | 30.27 | −97.74 | 4 % |
| Toronto, ON | CA | 43.65 | −79.38 | 4 % |
| Vancouver, BC | CA | 49.28 | −123.12 | 2 % |
| London | GB | 51.51 | −0.13 | 3 % |
| Sydney, NSW | AU | −33.87 | 151.21 | 1 % |

Add a small random offset (±0.3°) per order so pins in one city spread a little, then let the
0.5° pin-merge rule in §10 group them.

### Shipping and carriers

| Carrier | Used for | Transit time |
|---------|----------|--------------|
| USPS Ground Advantage | US orders under 2 lb (55 % of US) | 2–5 days |
| UPS Ground | US orders 2 lb and up (45 % of US) | 2–4 days |
| FedEx International | CA, GB, AU | 6–12 days |

- Handling (order to `shipped_at`): 1 day for 90 %, 2 days for 7 %, 3+ days for 3 %.
- Tracking numbers: random strings in each carrier's usual shape. Tracking URLs stay `null`
  (no fake links to real carrier sites).
- Events per shipment: `label_created` → `in_transit` (with a hub `place` and lat/lng about
  half the time) → `out_for_delivery` → `delivered`.
- Carrier ETA: set on about 70 % of in-transit shipments; the rest show "No carrier ETA".

### Delay mix (for orders still open plus the last 7 days of deliveries)

- About 10 % `late`, 8 % `at_risk`, the rest `on_time`; 3–5 `delivered_late`.

**Delay stories the demo must show** (set on purpose):

1. A Sydney order stuck in `exception` ("held at customs") — also proves the date-line arc.
2. A cluster of 4 UPS shipments to Denver, 3 days late ("weather delay at hub").
3. One USPS shipment to Chicago with no scan for 52 h → `at_risk` ("stalled").
4. One order placed 3 days ago that has not shipped yet → `at_risk` ("not shipped yet"),
   waiting on the out-of-stock Fall Seasonal Blend `GR-12OZ`.
5. Two delivered-late orders to London (1 and 2 days late).

---

## 4. The product

A private 3D dashboard for one e-commerce company. Desktop first, works on phones.

- A **company** (organisation) owns everything. Every row carries `org_id`. The MVP has one company,
  but the column exists from day one because adding it later is a migration on every table.
- A **warehouse** (id `W01`, `W02`, …, never changes; the name can) sits at its lat/lng on the map.
- **Products** have **variants** (one row per SKU: size, colour, …). Stock is kept **per variant
  per warehouse**.
- An **order** goes to a destination (city, region, country, lat/lng only). It has a placed date
  and a promised date (its own, or placed + SLA days).
- A **shipment** leaves one warehouse for one order, with a carrier, tracking number, items, and a
  timeline of **status events**.
- Each shipment flies as a **cargo drone** along an arc from its warehouse to its destination,
  coloured by its **delay status**.
- The **Alerts** panel lists late and at-risk shipments, worst first, with how many days late and
  the carrier ETA when there is one.
- The **Inventory** screen is a **table**, not 3D: product → variants → per warehouse on hand,
  reserved, available, reorder point, low-stock flag. The 3D warehouse shows only a summary.

### Three journeys (design every screen at 375 px too)

```
Ops lead:   log in → map → Alerts (3 late) → tap a red drone → shipment card → days late,
            last event, carrier ETA → "Open tracking" or "Acknowledge" with a note
Stock:      Inventory → filter "low stock" → variant row → add a movement (received +50) → saved
Import:     Shipments → "Import CSV" → preview rows and errors → confirm → drones appear on the map
```

---

## 5. Stack (same versions as Central Meetup)

```
next 16.3.x (App Router, proxy.ts)      react / react-dom 19.2.x
three 0.186   @react-three/fiber 9.8    @react-three/drei 10.7    @react-three/postprocessing 3.1
@supabase/supabase-js 2.117   @supabase/ssr 0.12   server-only
tailwindcss 4 (@tailwindcss/postcss)    typescript 5 (strict)    eslint 9 + eslint-config-next 16
vitest 3 + jsdom + @testing-library/react    @vercel/analytics
Hosting: Vercel (staging branch → staging site, main → production)
Database, auth: Supabase (two projects: staging and production)
Email: Resend over SMTP from Supabase Auth.
Fonts (self-hosted in public/fonts): Silkscreen (titles/buttons), Space Grotesk (body, tables).
Land map: Natural Earth 1:110m land (public domain), baked once into public/map/land.json.
```

`package.json` scripts:

```json
"dev": "next dev", "build": "next build", "start": "next start", "lint": "eslint",
"test": "vitest run", "typecheck": "next typegen && tsc --noEmit",
"bake:land": "tsx scripts/bakeLand.ts", "seed:demo": "tsx scripts/seedDemo.ts"
```

`tsconfig.json`: strict, `moduleResolution: bundler`, alias `"@/*": ["./*"]` (no `src/`).
`vitest.config.ts`: same alias, `environment: "node"`, include `**/*.test.ts(x)`; component tests
set `// @vitest-environment jsdom` at the top.

---

## 6. Architecture

```
app → features → engine | platform | ui | config → domain
```

| Folder | Holds | May import | Never |
|--------|-------|------------|-------|
| `domain/` | Rules, formulas, data shapes. Pure TS. Each file has a test next to it. Time rules take `now`. | other `domain/` | React, Three, Next, Supabase, `Date.now()` |
| `ui/` | `theme.ts` + `tokens.css` (a test keeps them equal) | nothing in the project | — |
| `config/` | Public settings (limits, defaults) | `domain/` | features, app, engine, platform |
| `platform/` | Supabase clients, one `*Repo.ts` per table, `http.ts`, `auth.ts`, `org.ts`. Starts with `import "server-only"`. | `domain/`, `config/` | React, features, app, engine |
| `engine/` | Reusable 3D pieces: land, warehouse, arcs, cargo drone, labels, effects | `domain/`, `ui/`, `config/` | features, app, platform |
| `features/<x>/` | One feature's client code, public API in `index.ts` | own folder, `domain`, `engine`, `ui`, `config` | other features, `app/`, `platform/` |
| `features/<x>/server/` | That feature's route handlers and server views, API in `server/index.ts` | + `platform/` | other features, `app/` |
| `app/` | Routes and pages. Imports features only via `@/features/<x>` or `@/features/<x>/server`. | anything | feature internals |

- `app/api/**/route.ts` is **one line**: `export { movementPOST as POST } from "@/features/inventory/server";`
- No `../../` imports; use `@/…`.
- Two features talk through a **callback or slot prop** wired in `app/_experience/Experience.tsx`.
  Example: the shipment card has an `action` slot; Experience puts the alerts feature's
  "Acknowledge" button in it.
- ESLint enforces it with `no-restricted-imports` blocks named `arch/*`. Never silence a boundary
  error; move the code.

### Folder map (what the finished app has)

```
app/            page.tsx (the map), layout.tsx, error.tsx, inventory, shipments, alerts,
                settings, login, forgot-password, reset-password, auth/callback,
                api/**/route.ts, _experience/Experience.tsx
domain/map      project, arc, land, bounds
domain/ship     types, status, delay, progress, events, csv
domain/stock    types, ledger, available, lowStock, sku
domain/org      roles, settings
domain/brand.ts
engine/         Land, Warehouse, RouteArcs, CargoDrones (instanced), Label, Effects,
                Atmosphere, NeonClock, useReducedMotion, usePortrait
features/       map (scene, camera, legend), shipments (card, timeline, import), alerts,
                inventory (table, movement form, product form), warehouses, settings, account
platform/       supabase, db, http, auth, org, ordersRepo, shipmentsRepo, eventsRepo,
                productsRepo, stockRepo, warehousesRepo, settingsRepo
scripts/        bakeLand.ts, seedDemo.ts
supabase/migrations/NNNN_name.sql
```

### Server patterns (carried over)

- `platform/supabase.ts`: `adminClient()` (service role, **all reads and writes**), `authClient()`
  (cookie session via `@supabase/ssr`), `refreshAuthSession(request)` for `proxy.ts`.
- `platform/db.ts`: `run(what, query)` returns data or throws `"<what> failed: …"`; retries once
  after 1 s on "JWT issued at future".
- `platform/http.ts`: `readJson`, `ok(extra)`, `fail(error, status, fields?)`.
- `platform/auth.ts`: `currentUser()` → `{ id, email }` only if the email is confirmed (`getUser()`).
- `platform/org.ts`: `requireMember(userId, role?)` → `{ orgId, role }` or throws 403. **Every**
  server view and route calls it and filters every query by that `orgId`.
- Pages load data on the server and pass it to the client scene. `dynamic = "force-dynamic"` on
  the map, inventory and alerts pages. The map refreshes its data every 60 s and on window focus.

---

## 7. Data (Supabase)

One migration per change, numbered, additive only once it reaches production. A fresh app starts
with `0001_init.sql` holding the whole schema below.

### Tables (every one has `org_id` → organisations, except `organisations`)

**`organisations`**: `id` uuid · `name` 2–60 · `sla_days` int 1–60 default 7 ·
`risk_window_hours` default 24 · `stall_hours` default 48 · `handling_days` default 2.

**`members`**: `org_id`, `user_id` → auth.users, `role` `owner` · `staff` · `viewer`; pk (org_id, user_id).

**`warehouses`**: `id` text `^W[0-9]{2,}$` · `name` 2–40 · `city`, `region`, `country` ISO-2 ·
`lat` −90..90 · `lng` −180..180.

**`products`**: `id` uuid · `title` 1–120 · `external_id` text (Shopify id later), unique per org.

**`variants`**: `id` uuid · `product_id` · `sku` 1–64 unique per org · `title` (e.g. "M / Black") ·
`external_id`.

**`stock_movements`** (the ledger, the only source of stock):

| column | rule |
|--------|------|
| id | uuid |
| variant_id, warehouse_id | → variants, warehouses |
| delta | int, not 0 |
| reason | `received` · `shipped` · `returned` · `adjusted` · `counted` |
| ref | text (shipment id, PO number, note); unique (reason, ref, variant_id, warehouse_id) when reason = `shipped` so a shipment is never taken twice |
| by_user, at | who and when |

**`stock_levels`**: (variant_id, warehouse_id) pk · `on_hand` int ≥ 0 · `reorder_point` int ≥ 0
default 0. `on_hand` is written **only** by `apply_movement()`.

**`orders`**: `id` uuid · `number` text unique per org · `placed_at` · `promised_at` (null = use
SLA) · `dest_city`, `dest_region`, `dest_country`, `dest_lat`, `dest_lng` · `external_id`.
No customer name, email, phone or street.

**`order_lines`**: order_id, variant_id, qty > 0. Reserved stock = lines of orders not yet shipped.

**`shipments`**: `id` uuid · `order_id` · `warehouse_id` · `carrier` · `tracking_number` ·
`tracking_url` https or null · `status` `label_created` · `in_transit` · `out_for_delivery` ·
`delivered` · `exception` · `returned` · `shipped_at` · `delivered_at` · `carrier_eta_at` ·
`last_event_at` · `ack_at`, `ack_by`, `ack_note` ≤ 200.

**`shipment_items`**: shipment_id, variant_id, qty > 0.

**`shipment_events`**: shipment_id, `at`, `status`, `lat`/`lng` null, `place` ≤ 60, `note` ≤ 200.

Every table: `enable row level security; revoke all on <t> from anon, authenticated;` and no
policies. The browser never touches the database. There are **no public views**: this is private
company data.

### Functions (all `security definer`, `set search_path = ''`, revoked from public/anon/authenticated, granted to service_role)

```sql
-- The only way stock changes. Atomic. Refuses to go below zero.
create function apply_movement(p_org uuid, p_variant uuid, p_wh text, p_delta int,
  p_reason text, p_ref text, p_user uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.stock_levels (org_id, variant_id, warehouse_id, on_hand)
  values (p_org, p_variant, p_wh, 0) on conflict do nothing;
  update public.stock_levels set on_hand = on_hand + p_delta
  where org_id = p_org and variant_id = p_variant and warehouse_id = p_wh
    and on_hand + p_delta >= 0;
  if not found then return false; end if;
  insert into public.stock_movements (org_id, variant_id, warehouse_id, delta, reason, ref, by_user)
  values (p_org, p_variant, p_wh, p_delta, p_reason, p_ref, p_user);
  return true;
exception when unique_violation then
  raise exception 'apply_movement: % already recorded', p_ref;
end; $$;
```

Also:

- `ship_shipment(id, at)`: sets `shipped_at`, `status = in_transit`, and calls `apply_movement`
  with `shipped` for each item in one transaction. Runs once: a second call is a no-op.
- `add_event(shipment_id, at, status, lat, lng, place, note, eta)`: inserts the event, updates
  `status`, `last_event_at = greatest(...)`, `carrier_eta_at` when given, `delivered_at` on
  `delivered`. Events may arrive out of order; status follows the latest `at`.
- `ack_shipment(id, user, note)`: sets the ack columns. An ack hides the alert until a new event
  arrives or the shipment gets one day later.
- `import_batch(org, jsonb)`: upserts orders, lines, shipments, items by `external_id` / `number`.
  Same file twice = no change.

### Status flow

```
order placed → label_created → (ship) in_transit → out_for_delivery → delivered
                                     ↘ exception ↗          ↘ returned (stock comes back by a returned movement)
```

---

## 8. Rules that must never break

Put these in the new CLAUDE.md, numbered.

1. Stock changes only through `apply_movement()`. `on_hand` is never written any other way.
2. `on_hand` never goes below zero. A refused movement is an error to the user (409).
3. A shipment takes stock once (`ship_shipment()` is idempotent; the ledger has a unique key).
4. Every query is filtered by the caller's `org_id` from `requireMember()`. No exceptions.
5. All reads and writes go through server routes with the service role. The browser never talks to
   the database.
6. `viewer` can read only. `staff` can add movements, events, imports and acks. `owner` also edits
   settings, warehouses and members.
7. Never store a customer's name, email, phone or street address. Destination is city, region,
   country, lat, lng.
8. Every time rule lives in `domain/ship/` and takes `now`. The server passes one `now` per request
   so the whole page agrees.
9. The cargo drone's position is an **estimate** unless the latest event has lat/lng. The card says
   "Estimated position" when it is.
10. Imports are idempotent: the same CSV twice changes nothing.
11. Only confirmed emails count as signed in. Login and forgot-password never reveal whether an
    email has an account. There is no public sign-up; the owner invites members.
12. `proxy.ts` answers 403 to a `POST /api/*` whose `Origin` host differs from `Host`; security
    headers as in Central Meetup; every redirect goes through `safeNext`.
13. Never hard-code a warehouse id, an org id or a hex colour outside `ui/theme.ts` / `ui/tokens.css`.
14. Never hard-code secrets; never commit `.env.local`; nothing in progress touches production.
15. The demo uses simulated data only. A "Simulated data" tag stays visible on every screen, and no
    real brand logo or artwork is shipped in the repo.

---

## 9. API (every route `POST`)

| Route | Who | Does |
|-------|-----|------|
| `/api/auth/login`, `logout`, `forgot`, `reset` | anyone / reset session | Supabase Auth; `429` on rate limits |
| `/api/inventory/product` | staff | create or edit a product and its variants |
| `/api/inventory/movement` `{ variantId, warehouseId, delta, reason, note }` | staff | `apply_movement()` |
| `/api/inventory/reorder` `{ variantId, warehouseId, reorderPoint }` | staff | set the reorder point |
| `/api/warehouses` | owner | create or edit a warehouse |
| `/api/shipments/import` multipart CSV | staff | parse, return a preview with row errors; with `confirm=1`, `import_batch()` |
| `/api/shipments/ship` `{ shipmentId, at }` | staff | `ship_shipment()` |
| `/api/shipments/event` `{ shipmentId, at, status, lat?, lng?, place?, note?, etaAt? }` | staff | `add_event()` |
| `/api/alerts/ack` `{ shipmentId, note }` | staff | `ack_shipment()` |
| `/api/settings` `{ slaDays, riskWindowHours, stallHours, handlingDays }` | owner | update the company's rules |
| `/api/members/invite` `{ email, role }` | owner | Supabase invite email |

Plus `GET /auth/callback`. Replies: `200 { ok: true, … }` or `{ error, fields? }` with
400/401/403/404/409/429/502. CSV ≤ 4 MB, ≤ 5,000 rows per file.

### CSV columns (one row per shipment item)

`order_number, placed_at, promised_at?, dest_city, dest_region?, dest_country, dest_lat, dest_lng,
sku, qty, warehouse_id, carrier?, tracking_number?, tracking_url?, shipped_at?`

Unknown SKU or warehouse = a row error, not a crash. Lat/lng are required in the MVP (no geocoding).

Example row for this demo:

```
DW-100412,2026-09-28T14:05:00Z,,Denver,CO,US,39.74,-104.99,DW-DARK-GR-1LB,2,W01,UPS Ground,1Z999AA10123456784,,2026-09-29T16:00:00Z
```

---

## 10. The 3D scene

One `<Canvas>` in `app/_experience/Experience.tsx`, with `MapControls` (pan + zoom, tilt limited
to 20°–70°), `Atmosphere`, `Effects`.

### Map math (all in `domain/map` and `domain/ship`, all tested)

- Ground plane X/Z, Y up. **1 scene unit = 1 degree.** The map is 360 × 180.
- Projection (equirectangular): `x = lng`, `z = −lat`. Inverse: `lng = x`, `lat = −z`.
- Land: `bakeLand.ts` turns Natural Earth land into a 1° grid (360 × 180 cells, 1 = land) saved as
  `public/map/land.json`. Each land cell is one instanced box, 0.9 wide, 0.3 tall.
- Route arc from warehouse A to destination B (both at y = 0):
  - `d = |B − A|`, peak height `h = clamp(0.25 · d, 2, 30)`.
  - Control point `C = (A + B) / 2 + (0, 2h, 0)`.
  - Point at t ∈ [0, 1]: `P(t) = (1 − t)² A + 2 (1 − t) t C + t² B`. Its highest point is `h` at t = ½.
  - Routes that cross the date line (`|lngB − lngA| > 180`) are drawn the long way across the
    map in the MVP. A test checks every arc stays inside the map.
- Destinations closer than 0.5° to each other share one pin with a count.

### Delay rules (`domain/ship/delay.ts`; `day = 24 h`)

- `promised = order.promised_at ?? order.placed_at + sla_days · day`
- Delivered: `on_time` if `delivered_at ≤ promised`, else `delivered_late`.
- Not delivered, in this order:
  1. `late` if `now > promised`
  2. `at_risk` if `status = exception`
  3. `at_risk` if `now > promised − risk_window`
  4. `at_risk` if shipped and `now − last_event_at > stall_hours` ("stalled")
  5. `at_risk` if not shipped and `now − placed_at > handling_days · day` ("not shipped yet")
  6. else `on_time`
- `days_late = ceil((ref − promised) / day)` where `ref = delivered_at ?? now`; 0 when not late.
- **How much longer:** `remaining = carrier_eta_at − now` when the carrier gave an ETA; otherwise
  `null`, and the card says "No carrier ETA". The app never invents a remaining time.
- Every result also carries a `reason` string ("3 days past promise", "no scan for 52 h").
- Alerts are sorted: `late` by days late (most first), then `at_risk`, then by order date.

### Cargo progress (`domain/ship/progress.ts`)

- Not shipped: `p = 0` (drone sits at the warehouse).
- Delivered: `p = 1`, then the drone fades out over 2 s and leaves a small pin for 7 days.
- In transit, no event position: `p = clamp((now − shipped_at) / (promised − shipped_at), 0, 0.95)`.
  If `promised ≤ shipped_at`, `p = 0.95`. A late drone holds at 0.95 and pulses.
- Latest event has lat/lng: the drone sits at that point, lifted onto the arc's height at the
  nearest `t`.

### What is drawn

| Piece | How |
|-------|-----|
| Sea + land | Dark floor; voxel land from `land.json` as one instanced mesh; thin neon coastline optional |
| Warehouse | A box tower at its lat/lng; height from total units on hand (log scale, 2–10 units); a ring at its base turns amber when any variant there is low, red when any is out |
| Routes | One arc per open shipment, colour by delay status; delivered routes dim and drawn only while hovered |
| Cargo drones | One **instanced** mesh for all drones; colour by status: `on_time` cyan, `at_risk` amber, `late` red, `delivered_late` dim red; late drones pulse |
| Destination pins | Small posts; size by count |
| Labels | drei `Text` with the self-hosted font: warehouse name; on hover, order number + status |
| Legend | Small 2D overlay: colour = status, counts per status, "positions are estimates" |
| Bloom | `EffectComposer` + `Bloom` (threshold 1, intensity 1.1, mipmap blur) on emissive parts only |

Clicking a drone, route or pin opens the **shipment card**: order number, items (SKU × qty),
warehouse, carrier, tracking link, placed / shipped / promised dates, status and reason, days late,
remaining time or "No carrier ETA", the event timeline, and the `action` slot.

### Phone budget

- DPR max 1.25 on phones, 2 on desktop. No shadows on phones.
- Draw at most 2,000 drones and arcs; past that, show the late and at-risk ones and a count of the
  rest.
- Target ≥ 30 fps on a real phone, ≥ 55 fps on desktop.
- Instanced meshes for land, drones and pins; one shared clock uniform, not per-mesh `useFrame`.
- Under `prefers-reduced-motion`: drones sit still at their progress point; no pulsing.

### React rules for the scene (carried over)

- `useEffect` only to sync with something outside React. Click results go in the handler; derived
  values in render or `useMemo`; "latest callback" refs become `useEffectEvent`.
- Motion lives in a pure `step(state, dt)` in `domain/` and a hook in `features/` that calls it
  from `useFrame`. Test it with `renderHook`, frame by frame.

---

## 11. Build order (milestones)

Each milestone ends with typecheck, test, lint and build passing, and one commit.

| id | Milestone | Done when |
|----|-----------|-----------|
| M0 | Skeleton | Next app with §5, `@/` alias, `eslint.config.mjs` with `arch/*`, theme + test, fonts, `CLAUDE.md`, `docs/`; `npm run dev` shows a dark page |
| M1 | Rules and math | `domain/map` (projection, arc, bounds) and `domain/ship` (delay, progress) and `domain/stock` (available, low stock) with tests for every rule in §7, §8 and §10, including the date-line and "no carrier ETA" cases |
| M2 | Static scene | Land baked; the map draws from fixture data: warehouse, arcs, drones at their progress point in status colours, pins, legend, bloom, pan/zoom; works at 375 px |
| M3 | Database | `0001_init.sql` with §7; owner pastes it into staging; `seedDemo.ts` builds the Death Wish demo from §3a (one company, warehouse `W01`, 12 products, 36 variants, 300 orders over the last 30 days, the destination and carrier mix, every stock story and delay story); same seed twice gives the same data; the map reads real data through the repos |
| M4 | Accounts and roles | Login, logout, forgot and reset password, owner invites members; confirmed emails only; `requireMember()` on every route; `proxy.ts` and security headers |
| M5 | Inventory | Inventory table with search and "low stock" filter; add a movement; refused below zero; reorder points; warehouse ring colour follows stock; ledger history per variant |
| M6 | Shipments | CSV import with preview and row errors; same file twice changes nothing; ship a shipment (takes stock once); add events by hand; shipment card with timeline |
| M7 | Delays and alerts | Alerts panel sorted per §10; acknowledge with a note; header badge with the late count; `/settings` edits SLA, risk window, stall hours, handling days, and the map recolours |
| M8 | Motion | Drones fly from their last point to their new one when data refreshes; late drones pulse; delivered fade; all proved with `step()` tests; phone budget met |
| M9 | Shopify sync (skipped for this build: `{DATA_SOURCE}` does not ask for it) | A Shopify custom app token in `.env.local`; a server action pulls products, variants, inventory levels, orders and fulfilments into the same tables by `external_id`; same pull twice changes nothing |

Then: staging deploy, owner tests on a real phone, production.

---

## 12. Outside setup (the owner does these; Claude gives the steps)

1. **Supabase**: two projects, staging and production. Auth → URL Configuration for localhost,
   staging, production. Turn on "Confirm email". Turn **off** public sign-ups (members are invited).
2. **Email**: Resend, verified domain, one API key per Supabase project, Supabase → Auth → SMTP.
   Invite and recovery templates use `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=…`.
3. **Land map**: if the sandbox can't download Natural Earth, the owner downloads the 1:110m land
   file once and drops it in `scripts/data/`.
4. **Vercel**: import the repo; `staging` → staging domain (behind Vercel login), `main` →
   production. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (sensitive), `NEXT_PUBLIC_SITE_URL`.
5. **Firewall**: limit `POST /api/auth/*` to 10 a minute per IP.
6. **Shopify (M9 only)**: a custom app in the store admin with read access to products, inventory,
   orders and fulfilments; its Admin API token goes in `.env.local` and Vercel, never in code.

### Workflow

Local (on the staging database) → `staging` branch → owner OK → migration on production → `main`.
A migration only adds; renaming or dropping takes two releases.

---

## 13. Lessons

### Carried over from Central Meetup (they cost time once)

- **Next 16 is not the Next you know.** Read `node_modules/next/dist/docs/` first. `proxy.ts`
  (export `proxy` and a static `config.matcher`). `next typegen` before `tsc`.
- Restart `next dev` after adding a new `[param]` route folder.
- **Grants drift.** After copying data between projects, check with
  `has_function_privilege('anon', …)` that anon can run none of your functions.
- **Pasting SQL into the wrong project** is the easiest mistake. Always name the project and give
  the editor link; production only at release.
- Supabase may answer "JWT issued at future": retry once after 1 s.
- Vercel refuses bodies over 4.5 MB: cap uploads at 4 MB.
- drei `Html` throws a React 19 unmount error in dev: use drei `Text` with a self-hosted font.
- An automated Chrome tab is frame-throttled: check screens in the browser, prove motion with
  `step()` tests.
- Seed every random thing the server and browser both draw, or hydration differs.
- Keep sizes in one config object (`MAP` in `domain/map/project.ts`).

### Known risks for this app (not hit yet; watch for them)

- **Time zones.** Store every time in UTC. Count days in UTC. Show dates in the company's time
  zone. A test covers an order placed at 23:30 local time.
- **`Date.now()` in render** makes server and browser disagree. Pass `now` from the server.
- **Events out of order** from carriers: sort by `at`, never by arrival.
- **A fixed 7 days is not a promise.** Express and ground, domestic and international differ. Keep
  `promised_at` per order so a real promise always wins over the default.
- **Estimated positions look like GPS.** Keep the "Estimated position" label.
- **Thousands of arcs** kill phones. Instance everything; cap per §10.
- **Seeded dates go stale.** The demo seed builds every date relative to the day it runs, so the
  late and at-risk stories still hold when the demo is shown weeks later. Re-run the seed before
  a pitch.
- Don't decide the open questions for the owner (business days vs calendar days, per-destination
  SLAs, multi-warehouse split shipments). Leave a `TODO(owner)` and use the defaults here.

---

## 14. Making it a different app

| To change | Change only |
|-----------|-------------|
| The demo client | §3a and `scripts/seedDemo.ts`; nothing else |
| The promise rule | `domain/ship/delay.ts` and the `organisations` settings; tests first |
| Add warehouses | Rows in `warehouses`; never code |
| What flies | `engine/CargoDrones.tsx` (shape), keep `progress.ts` and `step()` |
| Look | `ui/theme.ts` + `ui/tokens.css`, `engine/Land.tsx` |
| Data source | A new `features/<source>/server` that writes through `import_batch()` and `apply_movement()`; the rest stays the same |
| Map resolution | `bakeLand.ts` grid size and `MAP`; keep 1 unit = 1 degree |