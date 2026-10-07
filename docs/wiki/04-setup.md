# Setup

> **Owner:** DevEx · **Status:** Accepted · **Last updated:** 2026-10-07

## Purpose
Get the project running on a new machine.

## Requirements
- Node.js (current LTS)
- Docker (for local Postgres)

## Steps

**1. Create the app**
```bash
npx create-next-app@latest shipping-tracker --ts --app --eslint
cd shipping-tracker
```

**2. Install the 3D layer**
```bash
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
```

**3. Install state, map, and test tools**
```bash
npm i zustand us-atlas topojson-client d3-geo
npm i -D vitest @playwright/test @types/d3-geo @types/topojson-client
```

**4. Start Postgres**
```bash
docker run -d --name tracker-db -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres
```

**5. Set up Prisma**
```bash
npm i prisma @prisma/client
npx prisma init
```
Set `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"
```

**6. Canvas setup (client-only)**
- The R3F `<Canvas>` lives in a file marked `'use client'`.
- Import it with `dynamic(() => import('...'), { ssr: false })` from inside a client component. WebGL can't render on the server.

**7. Layering**
- Canvas: `position: absolute`, full size, behind everything.
- DOM: a CSS grid on top with three columns (Pipeline | Map | Summary), a header, and a legend row.

![Exploded view: R3F canvas behind, DOM grid on top](img/fig-layering.svg)
*Step 6 + 7 together: one canvas behind, one grid on top.*


## Done when
1. The title shows as DOM text.
2. A test cube renders in the Canvas behind it.
3. The first migration runs: `npx prisma migrate dev --name init` (after the schema in [Data Model](05-data-model.md) is added). This proves the database connection works.

## Common errors
| Error | Fix |
|-------|-----|
| `window is not defined` | The Canvas is rendering on the server. Use `ssr: false` (step 6). |
| Prisma can't connect | Check Docker is running and `DATABASE_URL` matches the password. |
| Black canvas | Add a light, or use `meshBasicMaterial` for the test cube. |

## Depends on
[Architecture](03-architecture.md)
