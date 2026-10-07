# Glossary

> **Owner:** Shared (append-only) · **Status:** Accepted · **Last updated:** 2026-10-07

## Purpose
One meaning per term. Every page uses these words exactly.

## Stages — where an order is

![Stage flow Ordered, Packed, In transit, Delivered with Backorder branch; timing scale On time, At-risk, Late](img/fig-stages-timing.svg)
*Stage and timing are two separate answers about the same order.*


| Term | Meaning |
|------|---------|
| **Ordered** | Order placed, not yet packed. |
| **Backorder** | Ordered, but blocked because the item is out of stock. |
| **Packed** | Shipping label bought or printed; waiting for the carrier. |
| **In transit** | Carrier has it and it's moving. |
| **Delivered** | Arrived at the destination. *(See OPEN-01.)* |

## Timing — how an order is doing

| Term | Meaning |
|------|---------|
| **On time** | Not late. |
| **Late** | Past the late rule. *(Rule: see [Status Engine](07-status-engine.md), OPEN-04.)* |
| **Days late** | Whole days past the late rule. Shown as "+Nd". |

## Places and objects

![How each place and object is drawn: region, warehouse, lane, order dot, destination, late lane, stack, shipment](img/fig-vocabulary.svg)


| Term | Meaning |
|------|---------|
| **Region** | One of West, Midwest, NE, South. Mapped from US states. *(OPEN-05.)* |
| **Warehouse** | The single fulfillment location in v1. |
| **Destination** | Where the customer receives the order. |
| **Order** | One customer purchase. |
| **Shipment** | One package (Shopify calls it a Fulfillment). One order can have several. *(OPEN-06.)* |
| **Stack** | The visual pile of waiting orders for one region at one stage. |
| **Lane** | A line on the map carrying order dots to a destination city: a spoke from the warehouse inside the warehouse's region, a horizontal line flowing west everywhere else. *(D-009.)* |
| **Total** | All orders counted on the page. |

## Adding a term
Append a row. Don't edit existing rows; propose changes in [Open Questions](15-open-questions.md).
