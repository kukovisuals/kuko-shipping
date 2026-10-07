# 3D Scene (React Three Fiber)

> **Owner:** 3D · **Status:** Built (M7 map, M8 objects) · **Last updated:** 2026-10-07

## Purpose
Everything drawn in the R3F Canvas.

## Canvas
- **Orthographic camera**, looking straight down. The design is flat; perspective would distort the map and the bars.
- Render on demand (`frameloop="demand"`), except while an animation runs. This saves battery on a page that's mostly still.
- Background transparent. The page color comes from CSS.

## Map geometry
1. Load US states from `us-atlas` (TopoJSON).
2. Convert to GeoJSON with `topojson-client`.
3. Project with `d3-geo`'s `geoAlbersUsa`. It handles Alaska and Hawaii insets, which the design shows.
4. Turn each state outline into a `THREE.Shape`, then a `ShapeGeometry`.
5. Merge states into four region meshes using the region table (OPEN-05), each nudged apart (D-009).
6. Region outlines: thin lines from the same outlines.

![Map geometry pipeline in six steps from TopoJSON to region meshes and borders](img/fig-map-geometry.svg)


## Built in M7
The map: 4 region meshes + 2 line sets (state borders, region borders) = **6 draw calls**.
- `lib/project.ts`: `project(lat, lng) → [x, y] | null` (null off the map), plus `albers` and `toScene` for geometry code. Scene units: map centered on the origin, y up, 1 unit = 1 projected pixel (975 × 610).
- `components/three/usMapGeometry.ts`: builds the geometry once. States are streamed through the projection (so the AK/HI insets clip correctly), merged per region with `regionForFips`. Territories are skipped.
- `UsMap.tsx` fits the map into the DOM's `.map` column (`useMapZone`), and `useThemeColors` reads `lib/tokens.ts` so the Canvas follows the Light/Dark toggle.
- `Scene.tsx`: orthographic camera, `frameloop="demand"`, transparent, `flat` (no tone mapping, so token colors show as written).

## Built in M8 (lanes redone to D-009)
All from the API, all instanced or batched: **16 draw calls** (counted from the code: 4 regions, state borders, region outlines, 2 lane sets, 2 bead sets (on time, late), arrowheads, destinations, warehouses, slabs, circles + arrows, dotted circle).
- **Regions are drawn apart** with a gap (`GAP` = 48 map units, `REGION_OFFSET` in `usMapGeometry.ts`). Each region has its own outline, so both sides of a shared edge are drawn.
- `laneLayout.ts` decides where everything goes (pure, tested in `laneLayout.test.ts` with all 51 capitals); `MapObjects.tsx` (from `/api/lanes`) turns it into geometry. Per D-009:
  - **Warehouse's region (NE):** a lane is a straight spoke, warehouse → city.
  - **Every other region:** a horizontal line at the city's latitude, from a shared end `END_MARGIN` past the region's east edge, flowing west to the city. An arrowhead at the east end points west.
  - **One lane per city** (the 51 state capitals, D-010), with **one bead per order day** (D-011, from `lane.days`). Day slots run along the lane from today at its start (arrowhead or warehouse) to the oldest day at the city, the same fractions on every lane, so late beads gather at the city end. The lane is solid up to the newest late day and dashed accent from there to the city. On time = ink disc, late = accent ring. A city's marker is accent-colored when it has more late shipments than on-time ones.
  - **Bead size:** area grows with that day's shipments. Full size (`BEAD_MAX`) is a busy day, the 90th-percentile day on the map (`BUSY_DAY`); bigger days are capped there, and no bead is smaller than `BEAD_MIN`. On a short lane (NE spokes, coast states) beads shrink to fit their slot so neighbours never overlap.
  - **No overlaps:** horizontal lanes in a region are spread so they sit at least `LANE_GAP` apart (`spread.ts`); a marker may sit slightly off its true latitude. Spokes are fanned at least `SPOKE_ANGLE` apart and are never shorter than `MIN_SPOKE`, so a city next to the warehouse (Trenton) doesn't hide under it.
  - **Lanes never touch another region:** a horizontal lane ends `END_MARGIN` past its region's east edge, *unless* another region is in the way on that row; then it stops `CLEARANCE` (largest bead + 4) short of it. So a few arrowheads sit further west than their neighbours (Alaska/Hawaii before Texas, Ohio before Pennsylvania).
  - Tests: no two horizontal lanes side by side closer than `LANE_GAP`; spokes at least `SPOKE_ANGLE` apart; spokes and horizontal lanes at least `LANE_GAP` apart; every lane at least `CLEARANCE` from every other region's state outlines. Warehouses come with their own `region` from the API.
  - Lanes are batched, not one drei `<Line>` each, which resolves OPEN-11.
- `Pipeline.tsx` + `pipelineLayout.ts` (from `/api/pipeline`): stacks of thin slabs, one per region per stage. Every stack shares one scale, so height is proportional to count. Store and In transit circles, and the flow lines (D-010): Store → Ordered, Ordered → Packed, Ordered → Backorder ("no stock"), Backorder → Packed ("restocked"), Packed → In transit. Labels (counts above, region names below, stage titles, notes, circle text) are the DOM pieces from `components/dom/PipelineLabels.tsx`, pinned with drei `<Html>`. It fits into the `.pipeline` column, as the map fits into `.map`.
- `Instanced.tsx`: many copies of one shape in one draw call, each with its own color.

- Not yet: hatch patterns on regions, hover, fade for the selected region (M9).

## Objects

| Object | How it's built | Why |
|--------|----------------|-----|
| Region shapes | Merged `ShapeGeometry`, one mesh per region | 4 draw calls instead of 50 |
| Lanes | drei `<Line>` | Clean, resolution-independent lines |
| Order-day beads | Two `InstancedMesh` (disc, ring) | ~500 beads in two draw calls |
| Destinations | One `InstancedMesh` (ring + center) | Same reason |
| Warehouse | Single mesh, concentric rings | One object |
| Pipeline stacks | `InstancedMesh` of thin boxes | One draw call for all stacks |

## Projection helper
One function, `project(lat, lng) → [x, y]`, used by every object. If it's defined in two places, the dots will drift off the map.

## Styling
- Materials read colors from `lib/tokens.ts`, the same file the CSS uses.
- Late lanes: dashed line in the accent color (matches the hatched fill).
- Hatch and dot patterns on shapes: a small fragment shader, or a repeating texture.

## Performance budget
- 60 fps on a mid-range laptop with 2,000 orders.
- Under 20 draw calls total.

![Draw-call count: about 30 as specced, about 14 with lanes batched; budget is 20](img/fig-draw-calls.svg)
*Counted from the current design. One drei `<Line>` per lane breaks the budget. See OPEN-11.*


## Open items
- OPEN-03: Closed by D-009 (see above).
- OPEN-06: Dot = order or shipment.
- OPEN-08: Warehouse coordinates.

- OPEN-11: Resolved in M8 by batching lanes (see above).


## Depends on
[API](08-api.md) · [Interactions & Animation](11-interactions-animation.md)
