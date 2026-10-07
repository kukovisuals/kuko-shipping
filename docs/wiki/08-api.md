# API

> **Owner:** Backend · **Status:** Proposed · **Last updated:** 2026-10-07

## Purpose
Every endpoint the UI calls, and what it returns.

## Rules
- All endpoints are Next.js route handlers under `app/api/`.
- They read **derived** fields only. They never compute status.
- All responses are JSON. Counts are integers.
- Each response includes `computedAt`, so the UI can show data freshness.

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
      "points": [{ "lat": 0, "lng": 0 }],
      "destinations": [{ "lat": 0, "lng": 0, "city": "Portland" }]
    }
  ]
}
```
Lane shape depends on OPEN-03.

## GET `/api/regions/[region]/late?limit=6`
Feeds: the late-orders list.
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
| 400 | Unknown region |
| 500 | Database or engine failure; body `{ "error": "message" }` |

## Caching
Responses can be cached for the refresh interval (OPEN-07). The client re-fetches on the same timer.

## Depends on
[Status Engine](07-status-engine.md) · [Data Model](05-data-model.md)