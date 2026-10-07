# Design Spec

> **Owner:** Design · **Status:** Proposed · **Last updated:** 2026-10-07

## Purpose
What every zone of the one-page design shows, and the visual rules.

## The design

![Order Board design, light theme](img/design-light.png)

![Order Board design, dark theme](img/design-dark.png)
*Light and dark themes. Same layout, same fills; only the palette changes.*

## Layout

![The seven zones of the page: header title, Total, pipeline, map, summary rows, late-orders list, legend](img/fig-layout-zones.svg)

<details><summary>Plain-text version</summary>

```
┌──────────────────────────────────────────────────────────────┐
│ Title (left)                                      TOTAL (right)│
├───────────────┬────────────────────────────┬─────────────────┤
│ PIPELINE      │ MAP                        │ SUMMARY         │
│ Store         │ US map, 4 regions          │ Region bars     │
│ Ordered stacks│ Region cards               │ Late-orders list│
│ Backorder     │ Lanes, dots, destinations  │                 │
│ Packed stacks │ Warehouse marker (NE)      │                 │
│ In transit    │                            │                 │
├───────────────┴────────────────────────────┴─────────────────┤
│ LEGEND                                                         │
└──────────────────────────────────────────────────────────────┘
```
</details>

## Zones

**Header**
- Title: "How many orders are late for delivery?"
- TOTAL: the largest element on the page. One proportional bar under it, with counts.

**Pipeline (left column)**
- Store circle at the top. Orders flow down from it.
- ORDERED: one stack per region, with the count above each.
- BACKORDER: one small stack per region. Arrow in labeled "no stock." Arrow out to Packed labeled "restocked."
- PACKED: one stack per region.
- IN TRANSIT: one dotted circle with a count.

**Map (center column)**
- US map split into four regions, including Alaska and Hawaii insets.
- Each region has a card: name, total, one proportional bar, counts.
- Lanes: lines of order dots ending at destination markers.
- Late lanes use the late fill (dashed, accent color).
- Warehouse marker in NE with spokes to nearby destinations.

**Summary (right column)**
- One row per region: name, proportional bar, late count.
- Clicking a region row opens that region's late-orders list.
- List row: order number, city, days late (e.g. "+4d").
- List shows 6 rows, then "+ N more."

**Legend (footer)**
- On time, Late, In transit, Stack, Backorder, Store, Order, Destination, Warehouse.

## Visual rules

![Visual rules: fills stay distinct in grayscale, bars are equal length split by ratio, cards show numbers only](img/fig-visual-rules.svg)
*Rules 1–4 in practice. South is the only region at 50% late; the equal-length bars make that obvious.*

1. **State words appear only in the legend.** Bars and cards show numbers only.
2. **Color is never alone.** Every state has a fill pattern too (solid, hatched, dotted), so it works for colorblind viewers and in grayscale.
3. **Bars are proportional.** Same total length; split by ratio.
4. **Callouts are numbered** (①, ②) and say what happens on click.
5. **Every number comes from** [Seed Data](06-seed-data.md).

## Callouts
- ① Click Store → Ordered and Packed stacks collapse into one count each.
- ② Click West in sidebar → list of West's late orders opens.

## Known gaps
- OPEN-01: Packed is 1,840 but In transit is 400. Where are the other 1,440?
- OPEN-02: At-risk is not in the legend. Is it in v1?
- OPEN-03: Lanes run horizontally across regions, but there is one NE warehouse. What does a lane represent?

## Depends on
[Glossary](02-glossary.md) · [Seed Data](06-seed-data.md)
