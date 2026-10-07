# Shopify Integration (Phase 2)

> **Owner:** Integrations · **Status:** Draft · **Last updated:** 2026-10-07

## Purpose
How real store data replaces the seed. **Not started. Phase 2.**

## Approach
- Use the **Shopify Admin GraphQL API**.
- A sync job runs on the same timer as the refresh model (no webhooks in v1).
- The job fills the **same tables** the seed fills. The UI and API don't change.
- After each sync, run the Status Engine.

![Shopify sync fills the same tables as the seed; field mapping with known gaps](img/fig-shopify-mapping.svg)


## Data we read

| Our field | Shopify source |
|-----------|----------------|
| Order name, createdAt, destination | `Order` |
| `displayFulfillmentStatus` | `Order.displayFulfillmentStatus` |
| `holdReason` | Fulfillment hold reason on the fulfillment order |
| Shipment timestamps | `Fulfillment.createdAt`, `inTransitAt`, `estimatedDeliveryAt`, `deliveredAt` |
| Events | `Fulfillment.events` → `FulfillmentEvent.status`, `happenedAt` |

## Known data gaps
- **No "Packed" status.** We use label purchased/printed as the signal.
- **Backorders can hide.** Shopify has no backorder status. The out-of-stock hold only exists if the merchant or an app applies it. Otherwise the order just looks unfulfilled.
- **Estimates can be missing.** `estimatedDeliveryAt` is nullable. This affects late rule option A (OPEN-04).
- **Split shipments.** One order can have several fulfillments (OPEN-06).

## To decide when Phase 2 starts
- App type (custom app on a dev store first).
- Access scopes: read orders and fulfillment orders, at minimum.
- First backfill size (how many days of history).
- Rate-limit handling for large stores.

## Depends on
[Data Model](05-data-model.md) · [Status Engine](07-status-engine.md)
