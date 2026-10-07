# Testing

> **Owner:** QA · **Status:** Built (M10) · **Last updated:** 2026-10-07

## Purpose
What gets tested, with which tool, and when.

## Layers

| Layer | Tool | What it proves |
|-------|------|----------------|
| Status Engine | Vitest | Every stage and timing rule gives the right answer |
| Seed | Vitest | The seed hits the [Seed Data](06-seed-data.md) numbers exactly |
| API | Vitest | Each endpoint returns the documented shape |
| UI flows | Playwright | Callouts ① and ② work end to end |
| Visual | Manual | Screen matches the one-page design |

![Test layers with the seven must-pass checks and when tests run](img/fig-test-layers.svg)


## Must-pass checks
1. Engine output on the seed = Seed Data table, number for number.
2. Ordered − Backorder = Packed, for every region.
3. Total = sum of regions.
4. Click Store → stacks collapse; click again → they expand.
5. Click West → late list opens with 6 rows and "+ 144 more."
6. Reduced motion on → no animation runs.
7. 60 fps with 2,000 orders (manual check with the browser performance panel).

| # | Where | How |
|---|-------|-----|
| 1 | `tests/must-pass.test.ts` | Reads the seeded database through the real `/api/summary` and `/api/pipeline` handlers and compares every region with `prisma/seed.config.ts` (orders, on time, late, backorder, packed, and in transit overall). |
| 2 | `tests/must-pass.test.ts` | Per region, from `/api/pipeline` (also in `app/api/api.test.ts`). |
| 3 | `tests/must-pass.test.ts` | Total against the sum of regions (also in `app/api/api.test.ts`). |
| 4 | `e2e/must-pass.spec.ts` | Store button: `aria-pressed` flips, the two stage totals appear (summed from `/api/pipeline`), the per-stack counts hide, and all of it reverses. **Skipped while the pipeline column is hidden** (`SHOW_PIPELINE = false` in `app/page.tsx`): set it to `true` and run with `E2E_PIPELINE=1`. |
| 5 | `e2e/must-pass.spec.ts` | Click West: 6 rows, and `+ N more` where N comes from `/api/regions/WEST/late` (never typed). Also the fade of the other cards, and the keyboard path (Enter opens, Escape closes). |
| 6 | `e2e/must-pass.spec.ts` | With `reducedMotion: 'reduce'`: no running animation, `transition-duration: 0s`, and the faded card is at its end opacity at once. The same steps with motion allowed show a 300 ms transition, so the check can fail. Covers the DOM half; the 3D tween is `useTween`, which jumps to the end state under the same setting (see `components/three/useTween.ts`). |
| 7 | Manual | Below. |

Every e2e test also fails on any uncaught page error.

## Running them
- `npm test`: Vitest (engine, seed, API, layout, checks 1 to 3). Needs the database: `docker start tracker-db`, then `npm run db:seed` and `npm run engine`.
- `npm run test:e2e`: Playwright. It builds the app and serves it on port 3101 (so it never touches `npm run dev`), or reuses a server already there. First time on a machine: `npx playwright install chromium`.
- Playwright files stay out of the repo: results go to `.next/e2e-results`.

## Check 7: 60 fps with 2,000 orders (manual)
1. `npm run db:seed`, `npm run engine`, `npm run build`, `npm run start`. Use the production build; dev mode is slower.
2. Open the page in Chrome, then DevTools → Performance → record for 5 seconds while you click a region row, press Escape, and (if the pipeline is on) click Store twice.
3. Pass: the frame chart stays near 60 fps with no long red frames while the fades run, and the page is still when you leave it alone (the Canvas draws on demand).
4. Optional: the draw-call budget (under 20) is counted in wiki 10; `renderer.info.render.calls` in the Canvas gives the live number.

Last run: not yet (record the date, machine and result here).

## When tests run
- Unit and API tests: on every commit.
- Playwright: before every merge.
- Visual check: before every demo.

## Depends on
[Status Engine](07-status-engine.md) · [API](08-api.md) · [Interactions & Animation](11-interactions-animation.md)
