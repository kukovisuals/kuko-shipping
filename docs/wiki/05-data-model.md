# Data Model

> **Owner:** Backend · **Status:** Proposed · **Last updated:** 2026-10-07

## Purpose
The tables, and which fields are raw vs derived.

## Design principles
- **Raw fields mirror Shopify.** Phase 2 then becomes "fill the same tables from Shopify" instead of a rewrite.
- **Derived fields are written only by the Status Engine.** Nothing else sets `stage`, `timing`, or `daysLate`.

## Multiple warehouses
The model supports any number of warehouses (D-009).
- A warehouse is one row in `Location` (Shopify's name for it; naming: OPEN-10).
- **Before shipping**, an order waits at its *assigned* warehouse → `Order.assignedLocationId`.
- **When shipped**, each shipment records the warehouse it left from → `Shipment.locationId`.
- So one order can ship from two warehouses: two shipments, two `locationId`s.
- v1 seeds one warehouse and the UI shows all warehouses combined.

## Schema (Prisma)

```prisma
enum Region {
  WEST
  MIDWEST
  NE
  SOUTH
}

enum Stage {
  ORDERED
  BACKORDER
  PACKED
  IN_TRANSIT
  DELIVERED
}

enum Timing {
  ON_TIME
  AT_RISK
  LATE
}

model Location {                                 // = Warehouse (see Glossary)
  id         String     @id @default(cuid())
  shopifyId  String?    @unique                 // null in Phase 1
  name       String                             // e.g. "NJ Warehouse"
  city       String
  state      String                             // two-letter code
  lat        Float
  lng        Float
  orders     Order[]                            // orders waiting here
  shipments  Shipment[]                         // shipments that left from here
}

model Order {
  id                       String    @id @default(cuid())
  shopifyId                String?   @unique    // null in Phase 1
  name                     String               // e.g. "#48210"
  createdAt                DateTime
  destinationCity          String
  destinationState         String               // two-letter code
  lat                      Float
  lng                      Float
  displayFulfillmentStatus String               // Shopify order-level status
  holdReason               String?              // e.g. INVENTORY_OUT_OF_STOCK
  assignedLocationId       String               // warehouse it waits at before shipping
  assignedLocation         Location  @relation(fields: [assignedLocationId], references: [id])
  shipments                Shipment[]

  // derived — Status Engine only
  region     Region?
  stage      Stage?
  timing     Timing?
  daysLate   Int?
  computedAt DateTime?

  @@index([assignedLocationId])
}

model Shipment {
  id                  String    @id @default(cuid())
  shopifyId           String?   @unique         // null in Phase 1
  orderId             String
  order               Order     @relation(fields: [orderId], references: [id])
  locationId          String                    // warehouse it shipped from
  location            Location  @relation(fields: [locationId], references: [id])
  createdAt           DateTime
  inTransitAt         DateTime?
  estimatedDeliveryAt DateTime?
  deliveredAt         DateTime?
  events              ShipmentEvent[]

  @@index([locationId])
}

model ShipmentEvent {
  id          String   @id @default(cuid())
  shipmentId  String
  shipment    Shipment @relation(fields: [shipmentId], references: [id])
  status      String   // Shopify FulfillmentEventStatus, e.g. IN_TRANSIT
  happenedAt  DateTime
}
```

## Field sources
| Field | Phase 1 | Phase 2 |
|-------|---------|---------|
| Warehouses | Seed script | Shopify `Location` |
| Raw order fields | Seed script | Shopify `Order` |
| Order's assigned warehouse | Seed script | Shopify `FulfillmentOrder.assignedLocation` |
| Shipment timestamps | Seed script | Shopify `Fulfillment` |
| Shipment's warehouse | Seed script | Shopify `Fulfillment.location` |
| Events | Seed script | Shopify `FulfillmentEvent` |
| Derived fields | Status Engine | Status Engine |

## Open items
- OPEN-06: Does one map dot = one order or one shipment?
- OPEN-10: Name the table `Location` (Shopify's word) or `Warehouse` (Glossary word)?
- OPEN-11: An order split across two warehouses *before* shipping only stores one assigned warehouse.

## Depends on
[Glossary](02-glossary.md) · [Status Engine](07-status-engine.md)