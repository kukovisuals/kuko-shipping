# Seed Data

> **Owner:** Data · **Status:** Proposed · **Last updated:** 2026-10-07

## Purpose
The fake data (Death Wish Coffee concept) and the numbers it must hit. Every number on the design comes from here.

> The earlier version of this page was a stale copy of the Testing page. This one is rebuilt from the figure `fig-seed-regions.svg`, the API examples in [API](08-api.md), and the must-pass checks in [Testing](13-testing.md).

## Where the numbers live
`prisma/seed.config.ts` is the only place numbers are typed. The seed, its checks, and its tests read from it.

![Seed target numbers by region](img/fig-seed-regions.svg)

| Region | Orders | On time | Late | Backorder | In transit | Packed |
|--------|-------:|--------:|-----:|----------:|-----------:|-------:|
| West | 750 | 600 | 150 | 50 | 150 | 550 |
| Midwest | 500 | 400 | 100 | 30 | 100 | 370 |
| NE | 350 | 300 | 50 | 20 | 60 | 270 |
| South | 400 | 200 | 200 | 60 | 90 | 250 |
| **Total** | **2,000** | **1,500** | **500** | **160** | **400** | **1,440** |

Packed is what is left: orders − backorder − in transit. The per-region in-transit split is a Data default; only the 400 total comes from the API example.

## How the data is built
- **One warehouse:** Newark, NJ (OPEN-08), id `loc-1`. All orders and shipments use it.
- **Same data every run:** fixed random seed `4242`. Dates are relative to the moment you run the seed.
- **Raw fields only.** The seed never writes `region`, `stage`, `timing`, `daysLate`, or `computedAt`. Run `npm run engine` after it.
- **Stages:** no order is plain "Ordered" and none is delivered. Every order is Backorder, Packed, or In transit, so *Ordered − Backorder = Packed* holds (must-pass check 2).
- **Backorder** orders have `holdReason = INVENTORY_OUT_OF_STOCK` and no shipment.
- **Packed** orders have one shipment whose latest event is `LABEL_PURCHASED` or `LABEL_PRINTED`.
- **In transit** orders have one shipment that went through pickup and `IN_TRANSIT` (some also `OUT_FOR_DELIVERY`).
- **Late orders** are always Packed or In transit, 8 to 14 days old, with a carrier estimate already past. **On-time orders** are under 6.5 days old, with an estimate still ahead. So rule A and rule B give the same answer on every order (OPEN-04 does not change the numbers).
- **No problem events** (`DELAYED`, …): at-risk is not built (OPEN-02).
- **Destinations:** about 65 real cities, weighted by size. AK and HI are included for the map insets. Region comes from the state (OPEN-05).
- Order names run `#48210`, `#48211`, … oldest first. Ids are readable: `ord-48210`, `shp-48210`, `evt-48210-1`.

## Invariants (the seed fails if any break)
Checked by running the real engine over the generated data, before anything is written to the database.

1. **Order counts:** each region, and so the total, has the configured number of orders.
2. **On time and late:** each region has the configured on-time and late counts, and more than 6 late orders (so the late list shows "+ N more").
3. **One stage each:** every order has exactly one stage, and the stage counts add up to the order count.
4. **Backorder and the pipeline identity:** each region has the configured backorder count, and Ordered − Backorder = Packed.
5. **In transit and shipments:** the in-transit total matches the config; backorder orders have no shipment; every other order has exactly one.
6. **Sanity:** order names are unique, states are valid, coordinates are in the US, nothing is dated in the future, and every order and shipment points at a real warehouse.

The invariants hold under both late rules, and stay true for 12 hours after seeding.

## Run it
```bash
npm run db:seed   # resets Location, Order, Shipment, ShipmentEvent, then fills them
npm run engine    # writes the derived fields
```
**Re-seed before a demo.** Dates are relative to the run, so after about 12 hours some on-time orders cross the 7-day line. The seed refuses to run when `NODE_ENV=production`.

## Open items
- OPEN-10: whether "Packed 1,840" means orders that *reached* Packed, or orders *at* Packed now. The seed supports the first reading (Ordered 2,000 − Backorder 160 = 1,840) but stores honest stages, so the API can compute either. The at-now count is 1,440.

## Depends on
[Data Model](05-data-model.md) · [Status Engine](07-status-engine.md)
