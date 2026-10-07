# Status Engine

> **Owner:** Backend · **Status:** Draft · **Last updated:** 2026-10-07

## Purpose
How each order gets its **stage** and **timing**. The only place that logic lives.

## Shape
A pure function. Same input, same output. No database calls inside.

```ts
type StatusInput = {
  order: {
    createdAt: Date
    displayFulfillmentStatus: string
    holdReason: string | null
    destinationState: string
  }
  shipments: {
    inTransitAt: Date | null
    estimatedDeliveryAt: Date | null
    deliveredAt: Date | null
    latestEventStatus: string | null
  }[]
  now: Date
}

type StatusOutput = {
  region: 'WEST' | 'MIDWEST' | 'NE' | 'SOUTH'
  stage: 'ORDERED' | 'BACKORDER' | 'PACKED' | 'IN_TRANSIT' | 'DELIVERED'
  timing: 'ON_TIME' | 'AT_RISK' | 'LATE'
  daysLate: number
}
```

A separate job reads orders, calls the function, and writes the derived fields. It runs after seeding (Phase 1) and after each sync (Phase 2).

## Stage rules (checked top to bottom; first match wins)

![Stage rules flowchart from delivered to ordered, first match wins](img/fig-stage-rules.svg)


| Stage | Rule | Shopify source |
|-------|------|----------------|
| Delivered | A shipment has `deliveredAt`, or latest event is `DELIVERED` | Fulfillment, FulfillmentEvent |
| In transit | Latest event is `CARRIER_PICKED_UP`, `IN_TRANSIT`, or `OUT_FOR_DELIVERY` | FulfillmentEvent |
| Packed | Latest event is `LABEL_PURCHASED` or `LABEL_PRINTED` | FulfillmentEvent |
| Backorder | `holdReason` is `INVENTORY_OUT_OF_STOCK` | FulfillmentHold |
| Ordered | Anything else (e.g. `UNFULFILLED`) | Order |

Note: Shopify has no "Packed" status. Label purchased or printed is the closest signal.

## Timing rules
**The late rule is undecided (OPEN-04).** Two options:

| Option | Late when | Strength | Weakness |
|--------|-----------|----------|----------|
| A | `now` > `estimatedDeliveryAt` and not delivered | Matches the carrier's promise | Estimate can be missing |
| B | More than 7 days since `createdAt` and not delivered | Always computable | Ignores carrier speed |

![Three example orders where rule A and rule B give different answers](img/fig-late-rules.svg)
*Each rule gets a different order wrong. That is the cost OPEN-04 has to weigh.*

Until decided, the engine implements **both**, selected by config: `LATE_RULE=A` or `LATE_RULE=B`.

- **daysLate** = whole days past the chosen threshold, rounded up, so a late order is always at least +1d. 0 if not late.
- **Delivered orders are never late.** Both rules say "and not delivered".
- **Rule A with no estimate** is on time (the engine cannot call it late). With several open shipments, the earliest estimate counts.
- **Rule B threshold:** `createdAt` + 7 days. Exactly 7 days is still on time.
- **At-risk:** not implemented until OPEN-02 is decided.
- Problem events (`DELAYED`, `ATTEMPTED_DELIVERY`, `FAILURE`) are candidate at-risk signals.

## Config
`computeStatus(input, lateRule = 'B')`. The rule is an argument, not an env read, so the function stays pure. The job reads `LATE_RULE` through `lateRuleFromEnv()` and passes it in.

## Several shipments
One shipment delivered → the order is Delivered (follows the stage table above, even if the other shipment is still moving). Otherwise the first matching stage over any shipment wins.

## Region rule
`destinationState` → region, using the table in `lib/regions.ts`. Which mapping: OPEN-05.

## Tests
- Table-driven: one row per rule, plus edge cases (missing estimate, partial delivery, backorder that got restocked).
- Running the engine on the seed must reproduce the [Seed Data](06-seed-data.md) numbers exactly.

## Depends on
[Glossary](02-glossary.md) · [Data Model](05-data-model.md)
