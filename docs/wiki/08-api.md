# API

> **Owner:** Backend · **Status:** Built (M5) · **Last updated:** 2026-10-07

## Purpose
Every endpoint the UI calls, and what it returns.

## Rules
- All endpoints are Next.js route handlers under `app/api/`.
- They read **derived** fields only. They never compute status.
- All responses are JSON. Counts are integers.
- Each response includes `computedAt` (the newest time the engine wrote an order), so the UI can show data freshness. It is `null` if the engine has never run.
- Orders the engine has not processed yet have no region and are left out of every endpoint.
- Code: `app/api/<route>/route.ts`, queries in `app/api/_lib/queries.ts`, tests in `app/api/api.test.ts`.

![Page zones tagged with the endpoint that feeds them: A summary, B pipeline, C lanes, D late list](img/fig-api-zones.svg)


## GET `/api/summary`
Feeds: Total, region cards, sidebar bars.
```json
{
  "computedAt": "2026-10-07T14:00:00Z",
  "total": { "count": 2000, "onTime": 1500, "late": 500 },
  "regions": [
    { "id": "WEST",    "name": "West",    "count": 750, "onTime": 600, "late": 150 },
    { "id": "MIDWEST", "name": "Midwest", "count": 500, "onTime": 400, "late": 100 },
    { "id": "NE",      "name": "NE",      "count": 350, "onTime": 300, "late": 50 },
    { "id": "SOUTH",   "name": "South",   "count": 400, "onTime": 200, "late": 200 }
  ]
}
```

## GET `/api/pipeline`
Feeds: Ordered, Backorder, and Packed stacks, plus the In transit circle.

- `ordered`: every order in the region.
- `backorder`: orders on hold for stock.
- `packed`: orders that *reached* Packed (Packed + In transit + Delivered), so Ordered − Backorder = Packed in every region (must-pass check 2). This is the first reading of OPEN-10; the at-now count would need a second field.
- `inTransit`: orders in transit right now, all regions together.
```json
{
  "computedAt": "2026-10-07T14:00:00Z",
  "ordered":   { "WEST": 750, "MIDWEST": 500, "NE": 350, "SOUTH": 400 },
  "backorder": { "WEST": 50,  "MIDWEST": 30,  "NE": 20,  "SOUTH": 60 },
  "packed":    { "WEST": 700, "MIDWEST": 470, "NE": 330, "SOUTH": 340 },
  "inTransit": 400
}
```

## GET `/api/lanes`
Feeds: map lanes, order dots, destinations, warehouses.
```json
{
  "computedAt": "2026-10-07T14:00:00Z",
  "warehouses": [
    { "id": "loc-1", "name": "NE Warehouse", "city": "", "lat": 0, "lng": 0 }
  ],
  "lanes": [
    {
      "id": "lane-1",
      "warehouseId": "loc-1",
      "region": "WEST",
      "timing": "LATE",
      "shipments": 12,
      "points": [{ "lat": 0, "lng": 0 }, { "lat": 0, "lng": 0 }],
      "destinations": [{ "lat": 0, "lng": 0, "city": "Portland" }]
    }
  ]
}
```
Lane shape follows OPEN-03 (default): **one straight line from a warehouse to a destination city**, so `points` is `[warehouse, city]`.
- A lane is one `(warehouse, city, timing)`. A city with both late and on-time shipments has two lanes on the same line, so a lane has one colour. Ids are readable: `lane-loc-1-or-portland-late`.
- `shipments` is how many shipments ride the lane. One dot per shipment (OPEN-06), so the map draws that many dots.
- Delivered orders are left out: lanes show what is still on its way.

## GET `/api/regions/[region]/late?limit=6`
Feeds: the late-orders list.

- Region is `WEST`, `MIDWEST`, `NE` or `SOUTH` (any letter case).
- `limit` defaults to 6; a whole number from 1 to 100.
- Orders are the most late first (ties by order name), so the list opens on the worst.
- `remaining` = `lateCount` − orders returned.
```json
{
  "region": "WEST",
  "lateCount": 150,
  "orders": [
    { "name": "#48210", "city": "Portland", "daysLate": 1 },
    { "name": "#48251", "city": "Reno", "daysLate": 4 }
  ],
  "remaining": 144
}
```

## Errors
| Code | When |
|------|------|
| 400 | Unknown region, or `limit` that is not a whole number from 1 to 100 |
| 500 | Database or engine failure; body `{ "error": "message" }` |

## Caching
Not cached in v1: every request reads the database. The client re-fetches on the refresh interval (OPEN-07) timer.

## Depends on
[Status Engine](07-status-engine.md) · [Data Model](05-data-model.md)