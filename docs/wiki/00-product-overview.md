# Product Overview

> **Owner:** Product · **Status:** Accepted · **Last updated:** 2026-10-07

## Purpose
What the app is, who it's for, and what's in scope.

## The question
**"How many orders are late for delivery?"**
Every element on screen must help answer it.

## Reader
**The CEO of a Shopify store.**
- Reads the page in about 5 seconds.
- Needs "are we okay or not?" first, detail second.
- Detail (individual orders) appears only on click.

## Goal
A working demo to pitch to Shopify store CEOs.
Concept target: **Death Wish Coffee**, using made-up data.

## Success test
A CEO who has never seen the app can answer, in 5 seconds:
1. How many orders are late in total?
2. Which region is worst?

![Five-second read path: Total shows 500 late, sidebar shows South is worst, a click opens the list](img/fig-five-second-read.svg)
*The read path the page is built for: ① Total → ② worst region → ③ details only on click.*


## In scope — v1
- One warehouse.
- Four US regions: West, Midwest, NE, South.
- Order pipeline: Ordered → Backorder → Packed → In transit.
- Map with shipment lanes and destinations per region.
- Total and per-region on-time vs late counts.
- Late-orders list per region.
- Fake seed data. Refresh on load and on a timer.

## Out of scope — v1
- Multiple warehouses.
- Inventory and variant management (backorders shown as counts only).
- Route-level detail for operations teams.
- Live real-time updates (webhooks).
- Sound.
- Real Shopify data (Phase 2).

## Phases
| Phase | What ships |
|-------|------------|
| 1 | Full UI on fake data, status engine, API |
| 2 | Real Shopify store connected ([Shopify Integration](12-shopify-integration.md)) |

## Depends on
[Design Spec](01-design-spec.md) · [Glossary](02-glossary.md)
