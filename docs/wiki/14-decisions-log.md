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

### D-009 — What a lane is, and regions drawn apart
- **Date:** 2026-10-07
- **Decision:** (1) In the **warehouse's own region**, a lane is a straight spoke from the warehouse to a destination city. (2) In **every other region**, a lane is a straight horizontal line at the city's latitude, running west to the city marker from a shared end just past the region's east side; its order dots sit on it and an arrowhead at the east end points west. (3) The four regions are drawn **apart with a gap** between them (the design image already shows this).
- **Why:** Kuko, after seeing the M8 build: the first default (a straight line from the warehouse to every city) made a starburst and did not match the design. This closes OPEN-03.
- **Replaces:** the OPEN-03 default in CLAUDE.md. Supersedes the "straight line warehouse → city" wording in page 08.
- **Affects pages:** 01, 02, 08, 10

### D-010 — Capital-city destinations, no overlapping lanes, full pipeline connections
- **Date:** 2026-10-07
- **Decision:** (1) Destinations are the **51 state capitals** (50 states + DC), one per state, so the map is not crowded. (2) The map draws **one lane per city** (a city's on-time and late shipments share one line: dashed and accent if any shipment is late, each dot colored by its own timing), and lanes in a region are **spread vertically so no two lines overlap**; a marker may sit slightly off its true latitude to make room. (3) The pipeline is connected: Store → Ordered; Ordered → Packed (in stock); Ordered → Backorder ("no stock"); Backorder → Packed ("restocked"); Packed → In transit. (4) Every stack carries its **region name below and its count above**; each stage has a small title (ORDERED, BACKORDER, PACKED).
- **Why:** Kuko, after seeing M8 rework: the map was too crowded and overlapping; the stacks had no labels; Ordered was not connected to Packed.
- **Affects pages:** 01, 06, 08, 09, 10

### D-011 — One bead per order day on each lane
- **Date:** 2026-10-07
- **Decision:** (1) A lane no longer draws one dot per shipment. It draws **one bead per order day**: the shipments of that city created on the same calendar day. (2) **Bead area grows with that day's shipment count**, on one scale for the whole map, and is capped at a maximum size so a busy day never becomes a blob. (3) **Position is the day:** every lane in a region shares the same day slots, today next to the arrowhead (the lane's start) and the oldest day next to the city, so the lanes of a region line up into one timeline and late beads gather at the city end. Spokes use the same slots along the spoke. (4) A bead is on time or late as a whole (rule B makes a day all one or the other); on time is a solid ink disc, late an accent ring (colour + pattern, rule 8).
- **Why:** Kuko, after seeing M8: one dot per shipment made the map busy (a lane held up to 236 dots) without saying more. Grouping by day keeps every lane under 15 beads and shows how old the late orders are.
- **Replaces:** the "one dot per shipment" default for OPEN-06 and the dot wording of D-010 (2).
- **Affects pages:** 08, 10
