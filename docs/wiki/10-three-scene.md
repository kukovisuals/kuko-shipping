# 3D Scene (React Three Fiber)

> **Owner:** 3D · **Status:** Draft · **Last updated:** 2026-10-07

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
5. Merge states into four region meshes using the region table (OPEN-05).
6. Region borders: thin lines from the same outlines.

![Map geometry pipeline in six steps from TopoJSON to region meshes and borders](img/fig-map-geometry.svg)


## Objects

| Object | How it's built | Why |
|--------|----------------|-----|
| Region shapes | Merged `ShapeGeometry`, one mesh per region | 4 draw calls instead of 50 |
| Lanes | drei `<Line>` | Clean, resolution-independent lines |
| Order dots | One `InstancedMesh` | Thousands of dots in a single draw call |
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
- OPEN-03: What a lane represents.
- OPEN-06: Dot = order or shipment.
- OPEN-08: Warehouse coordinates.

- OPEN-11: Lanes as separate drei `<Line>`s exceed the draw-call budget.


## Depends on
[API](08-api.md) · [Interactions & Animation](11-interactions-animation.md)
