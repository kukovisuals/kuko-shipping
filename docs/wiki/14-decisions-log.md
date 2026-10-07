# Decisions Log

> **Owner:** Shared (append-only) · **Status:** Accepted · **Last updated:** 2026-10-07

## Purpose
What was decided, when, and why. Newest at the bottom. Never edit an old entry; add a new one that replaces it.

## Entry format
```
### D-XXX — Short title
- Date:
- Decision:
- Why:
- Affects pages:
```

![Matrix of decisions against the pages they affect](img/fig-decisions-matrix.svg)
*Read a column to see every decision a page must follow.*


---

### D-001 — Primary reader is the CEO
- **Date:** 2026-10-07
- **Decision:** The page is designed for a Shopify store CEO.
- **Why:** CEOs approve the purchase; the demo is a pitch.
- **Affects pages:** 00, 01

### D-002 — Page question
- **Date:** 2026-10-07
- **Decision:** "How many orders are late for delivery?"
- **Affects pages:** 00, 01, 09

### D-003 — State words only in the legend
- **Date:** 2026-10-07
- **Decision:** Bars and cards show numbers only. Colors and fills are explained once, in the legend.
- **Why:** Repeating labels crowds the page.
- **Affects pages:** 01, 09

### D-004 — Next.js full-stack, React Three Fiber for 3D
- **Date:** 2026-10-07
- **Decision:** One Next.js project for UI and API. R3F is the main rendering tool.
- **Affects pages:** 03, 04

### D-005 — Fake data first, Shopify later
- **Date:** 2026-10-07
- **Decision:** Phase 1 runs on a seed (Death Wish Coffee concept). Phase 2 connects Shopify.
- **Affects pages:** 06, 12

### D-006 — Refresh on load and on a timer
- **Date:** 2026-10-07
- **Decision:** No live webhooks in v1.
- **Why:** Simpler, and a CEO view doesn't need second-by-second updates.
- **Affects pages:** 03, 08, 09, 12

### D-007 — DOM for text, R3F for space
- **Date:** 2026-10-07
- **Decision:** Text, numbers, and lists are React DOM. Map, lanes, dots, and stacks are R3F.
- **Why:** WebGL is weak at text and accessibility.
- **Affects pages:** 03, 09, 10

### D-008 — Pipeline visual left to the designer, with requirements
- **Date:** 2026-10-07
- **Decision:** Designer chooses the pipeline visual. It must show counts per region per stage, keep backorder visibly separate, reuse the legend fills, and read in 5 seconds.
- **Affects pages:** 01
