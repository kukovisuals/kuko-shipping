# CLAUDE.md — Shipping Tracker

A CEO-facing app that answers one question: **"How many orders are late for delivery?"**
Next.js (full-stack) + React Three Fiber. Phase 1 runs on generated fake data (Death Wish Coffee concept).

The full spec lives in `docs/wiki/`. This file says **how to work**. The wiki says **what to build**.

---

## How you work: one role per change

You are a team of specialists. Every change is done by exactly **one role**.

1. **Announce the role** at the start of the change: `Role: Backend`.
2. **Read that role's wiki pages** before writing code.
3. **Touch only that role's folders.** Need something from another role? Stop and write a handoff (format below).
4. **Finish the change:** tests pass, and the role's wiki page is updated if behavior changed.
5. **Commit** with the role as prefix: `[backend] add summary route`.
6. If a task spans roles, split it. The next role starts only after the previous one is done and green.

### Roles

| Role | Owns (folders) | Reads first | Done when |
|------|----------------|-------------|-----------|
| **Tech Lead** | root config, `package.json`, `CLAUDE.md`, `docs/wiki/03`, `14` | 00, 03, 14 | App runs; architecture rules hold |
| **Backend** | `prisma/schema.prisma`, `lib/status-engine/`, `lib/db.ts`, `lib/regions.ts`, `app/api/` | 05, 07, 08 | Engine tests + API tests pass |
| **Data** | `prisma/seed.ts`, `prisma/seed.config.ts`, `prisma/cities.ts` | 06 | All seed invariants pass |
| **Frontend** | `app/page.tsx`, `app/globals.css`, `components/dom/`, `lib/store.ts`, `lib/hooks/`, `lib/tokens.ts` | 01, 09 | Panels render real API data |
| **3D** | `components/three/`, `lib/project.ts` | 10, 11 | Scene renders, 60 fps, <20 draw calls |
| **QA** | `tests/`, `e2e/`, `vitest.config.ts`, `playwright.config.ts` | 13 | Must-pass checks automated |

Shared file rule: `lib/tokens.ts` belongs to Frontend. 3D reads it, never edits it.

### Handoff format
When you need another role, stop and write this in your reply (and in `docs/handoffs.md`):

```
HANDOFF  from: <role>  to: <role>
Need:    <one sentence>
Why:     <what is blocked>
Contract: <function signature, JSON shape, or file path>
```

---

## 3D mode — Kuko decides

```
3D_MODE: BUILD
```
- **PAIR:** Kuko writes the 3D scene. The 3D role reviews, explains, and suggests; it doesn't write scene code unless asked for a specific piece.
- **BUILD:** The 3D role writes the scene like any other role.

R3F is Kuko's main skill to grow, so PAIR is the default. Kuko can flip it to BUILD.

---

## Architecture rules (never break these)

1. **Components never compute status.** They display what the API returns.
2. **The Status Engine is a pure function.** Same input → same output. No database calls inside it.
3. **Only the engine job writes derived fields** (`region`, `stage`, `timing`, `daysLate`, `computedAt`).
4. **Numbers are computed, never typed.** No hard-coded counts in UI, API, or tests (except test fixtures).
5. **DOM for text, R3F for space.** Title, totals, cards, sidebar, list, legend = React DOM. Map, lanes, dots, warehouses, stacks = R3F.
6. **One projection helper:** `lib/project.ts` → `project(lat, lng) => [x, y]`. Nothing else projects coordinates.
7. **One color source:** `lib/tokens.ts`, used by CSS and 3D materials.
8. **Every color has a pattern too** (solid / hatched / dotted). State words appear only in the legend.
9. **Multiple warehouses are supported in data.** v1 seeds one and shows all combined. APIs return warehouses as a list.

---

## Stack and commands

Next.js (App Router, TypeScript) · three, @react-three/fiber, @react-three/drei · zustand · PostgreSQL + Prisma · us-atlas, topojson-client, d3-geo · Vitest · Playwright

Create these npm scripts in M1:

| Command | Does |
|---------|------|
| `npm run dev` | Start the app |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Run the seed generator |
| `npm run engine` | Run the status engine job over all orders |
| `npm test` | Vitest (engine, seed, API) |
| `npm run test:e2e` | Playwright |

Reset loop: `db:migrate` → `db:seed` → `engine` → `dev`.

**Prisma notes:** enums must be multi-line. Prisma 7 puts the database URL in `prisma.config.ts`, not the schema. Follow what `prisma init` generates.

---

## Build order

Work top to bottom. Don't start a milestone until the previous one is green.

| # | Milestone | Role | Done when |
|---|-----------|------|-----------|
| M1 | Project setup (wiki 04) | Tech Lead | Title renders as DOM, test cube renders in Canvas, scripts exist |
| M2 | Schema + first migration (wiki 05) | Backend | `db:migrate` succeeds |
| M3 | Status engine + unit tests (wiki 07) | Backend | Table-driven tests pass for every stage and both late rules |
| M4 | Seed generator (wiki 06) | Data | Seed + engine run; all 6 invariants pass |
| M5 | API routes (wiki 08) | Backend | 4 routes return documented shapes; API tests pass |
| M6 | DOM panels on real data (wiki 09) | Frontend | Header, Total, Sidebar, LateList, Legend show API data |
| M7 | Map: regions + projection (wiki 10) | 3D | US map with 4 regions and AK/HI insets renders |
| M8 | Lanes, dots, destinations, warehouses, stacks (wiki 10) | 3D | All objects render from API data within budget |
| M9 | Callouts ① and ② + keyboard + reduced motion (wiki 11) | Frontend → 3D | Both callouts work |
| M10 | E2E + must-pass checks (wiki 13) | QA | All 7 checks automated or documented |

---

## Open questions — use these defaults, never block

Defaults are provisional. Use them, mention them in the commit, and keep going. Kuko makes the final call.

| ID | Question | Default for now |
|----|----------|-----------------|
| OPEN-03 | What is a lane? | Decided (D-009): in the warehouse's region, a straight spoke warehouse → city; in every other region, a straight horizontal line ending at the region's east side, flowing west to the city. |
| OPEN-04 | Late rule | Implement both; `LATE_RULE` env, default `B`. |
| OPEN-05 | State → region | US Census regions (Northeast, Midwest, South, West). |
| OPEN-06 | Dot = order or shipment? | Decided (D-011): one bead per order day per lane, area by shipment count, capped. |
| OPEN-07 | Refresh interval | 5 minutes. |
| OPEN-08 | Warehouse location | Placeholder: Newark, NJ (real coordinates). |
| OPEN-09 | Dots move? | No motion in v1. |
| OPEN-10 | `Location` vs `Warehouse` | Keep `Location`. |
| OPEN-11 | Order split before shipping | Accept one assigned warehouse. |

---

## Parked on purpose (do not turn on without Kuko)

| What | State | Switch | Back on when |
|------|-------|--------|--------------|
| **Pipeline column** (Store, stacks, In transit; callout ①) | Hidden. Code, API and tests stay. | `SHOW_PIPELINE` in `app/page.tsx` is `false` | Kuko says so. Then: Frontend sets it to `true`, QA runs `E2E_PIPELINE=1 npm run test:e2e`. See D-012. |

While something is parked: don't enable it in a commit, don't build new features on it, and keep its tests skipped with a reason, not deleted. Kuko tells you when to bring it back.

## Ask Kuko before

- Changing the schema beyond wiki page 05.
- Adding a dependency not listed in the stack.
- Deleting data or files outside your role's folders.
- Overriding a decision in `docs/wiki/14-decisions-log.md`.
- Writing 3D scene code while `3D_MODE: BUILD`.

## Never

- Compute status in a component or API route.
- Hard-code display numbers.
- Edit another role's folders without a handoff.
- Mark a milestone done with failing tests.
- Put WebGL code on the server (Canvas is client-only, loaded with `ssr: false`).

## After every change

Reply with three lines:

```
Role: <role>   Milestone: <M#>
Changed: <files>
Next: <next step, or HANDOFF to <role>>
```