# Open Questions

> **Owner:** Shared (append-only) · **Status:** Accepted · **Last updated:** 2026-10-07

## Purpose
Everything that still needs a decision. When one is answered, log it in the [Decisions Log](14-decisions-log.md) and mark it closed here.

## Format
`OPEN-xx` · Question · Owner · Blocks · Status

---

| ID | Question | Owner | Blocks | Status |
|----|----------|-------|--------|--------|
| OPEN-03 | Lanes run horizontally, but there's one NE warehouse. What does a lane represent? | Design | 3D, API | Closed by D-009 |
| OPEN-04 | Late rule: A (past carrier estimate) or B (7+ days since order)? | Product | Engine, Seed | Open |
| OPEN-05 | Region mapping: which states go in which region? (US Census regions are a common standard.) | Product | Engine, 3D | Open |
| OPEN-06 | Does one map dot = one order or one shipment? | Design | Data model, 3D | Closed by D-011: one bead per order day, sized by shipments |
| OPEN-07 | Refresh interval (default 5 minutes)? | Tech Lead | API, Frontend | Open |
| OPEN-08 | Warehouse location (city + coordinates)? | Product | Seed, 3D | Open |
| OPEN-09 | Do order dots move along lanes? Speed? Always, or only on load? | Design | 3D | Closed by D-014: only on a Play week button, 14 s per week, late beads only |

| OPEN-10 | Pipeline counts: does "Packed 1,840" mean orders that *reached* Packed, or orders *at* Packed now? The Glossary says "at now," but then the four stages sum to 4,400 with only 2,000 orders. See [Seed Data](06-seed-data.md). | Product | Seed, Engine, API | Open |
| OPEN-11 | The current design has 11 lanes + 7 warehouse spokes. One drei `<Line>` each is ~30 draw calls, over the 20 budget. Batch lanes, or raise the budget? See [3D Scene](10-three-scene.md). | 3D | 3D | Open |

![Matrix of open questions against the teams they block](img/fig-open-questions.svg)
*Product owns most questions. 3D is blocked by the most.*

