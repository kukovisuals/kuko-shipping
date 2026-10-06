# Tickets — Cargo Atlas

Milestones from `docs/prompt-design.md` §11, built in order. Each one ends with typecheck, test,
lint and build passing and one commit whose message starts with its id.

Status: `[x]` done · `[ ]` open · `[-]` skipped

---

## [x] M0 — Skeleton

Next 16 app with the §5 stack, `@/` alias, `eslint.config.mjs` with `arch/*` layer rules, theme +
parity test, self-hosted fonts, `CLAUDE.md`, `docs/`.

**Done when:** `npm run dev` shows a dark page with the "Simulated data" tag; typecheck, test,
lint and build pass.

## [x] M1 — Rules and math

`domain/map` (projection, arc, bounds), `domain/ship` (delay, progress), `domain/stock`
(available, low stock).

**Done when:** every rule in spec §7, §8 and §10 has a test, including the date-line arc, "no
carrier ETA", out-of-order events and an order placed at 23:30 local time. No `Date.now()` in
`domain/`.

## [ ] M2 — Static scene

Bake land (`npm run bake:land`); draw the map from fixture data: warehouse, arcs, drones at their
progress point in status colours, pins, legend, bloom, pan/zoom.

**Done when:** the map renders from fixtures and works at 375 px.
**Needs owner:** the Natural Earth 1:110m land file in `scripts/data/` if the download is blocked.

## [ ] M3 — Database

`supabase/migrations/0001_init.sql` with spec §7; `scripts/seedDemo.ts` builds the Death Wish demo
from §3a.

**Done when:** the owner has pasted the migration into **staging**; the seed creates one company,
warehouse `W01`, 12 products, 36 variants, 300 orders over the last 30 days, the destination and
carrier mix, every stock story and delay story; the same seed twice gives the same data; the map
reads real data through the repos.
**Needs owner:** Supabase staging project, `.env.local` keys, SQL paste.

## [ ] M4 — Accounts and roles

Login, logout, forgot and reset password; owner invites members.

**Done when:** only confirmed emails sign in; login/forgot never reveal whether an email exists;
`requireMember()` guards every route; `proxy.ts` blocks cross-origin `POST /api/*` and sets
security headers; redirects go through `safeNext`.
**Needs owner:** Resend + Supabase SMTP, Auth URL configuration, public sign-ups off.

## [ ] M5 — Inventory

Inventory table with search and "low stock" filter; add a movement; reorder points; ledger history.

**Done when:** a movement below zero is refused (409); the warehouse ring colour follows stock;
each variant shows its ledger history.

## [ ] M6 — Shipments

CSV import with preview and row errors; ship a shipment; add events by hand; shipment card with
timeline.

**Done when:** the same CSV twice changes nothing; shipping takes stock exactly once; unknown SKU or
warehouse is a row error, not a crash.

## [ ] M7 — Delays and alerts

Alerts panel sorted per §10; acknowledge with a note; header badge with the late count; `/settings`
edits SLA, risk window, stall hours, handling days.

**Done when:** alerts sort late-by-days, then at-risk, then order date; an ack hides an alert until
a new event or one more day late; changing settings recolours the map.

## [ ] M8 — Motion

Drones fly from their last point to the new one on refresh; late drones pulse; delivered drones fade.

**Done when:** all motion is proved with `step()` tests; reduced motion holds drones still; the phone
budget in §10 is met.
**Needs owner:** a real-phone check (≥ 30 fps).

## [-] M9 — Shopify sync

Skipped for this build: `{DATA_SOURCE}` is the demo seed + CSV import.

---

After M8: staging deploy → owner tests on a real phone → production.
