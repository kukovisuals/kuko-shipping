# Testing

> **Owner:** QA · **Status:** Proposed · **Last updated:** 2026-10-07

## Purpose
What gets tested, with which tool, and when.

## Layers

| Layer | Tool | What it proves |
|-------|------|----------------|
| Status Engine | Vitest | Every stage and timing rule gives the right answer |
| Seed | Vitest | The seed passes its [invariants](06-seed-data.md#invariants-the-seed-fails-if-any-break) |
| API | Vitest | Each endpoint returns the documented shape |
| UI flows | Playwright | Callouts ① and ② work end to end |
| Visual | Manual | Screen matches the one-page design |

## Must-pass checks
1. All seed invariants pass.
2. Every order has exactly one stage, and stage counts add up to the order count.
3. Total = sum of regions.
4. Click Store → stacks collapse; click again → they expand.
5. Click West → late list opens with up to 6 rows, and "+ N more" equals West's late count minus the rows shown.
6. Reduced motion on → no animation runs.
7. 60 fps with 2,000 orders (manual check with the browser performance panel).

## When tests run
- Unit and API tests: on every commit.
- Playwright: before every merge.
- Visual check: before every demo.

## Depends on
[Status Engine](07-status-engine.md) · [API](08-api.md) · [Interactions & Animation](11-interactions-animation.md)