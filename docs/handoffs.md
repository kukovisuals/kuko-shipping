
HANDOFF  from: 3D  to: Backend
Need:    A way to get a Region from a us-atlas state, so the map can merge states into the four regions without a second state→region table.
Why:     us-atlas states carry a FIPS id and a name, not a postal code. `regionForState` takes postal codes, and rule 3D/OPEN-05 says nothing else decides a region.
Contract: lib/regions.ts exports `regionForFips(fips: string): Region` (2-digit string, e.g. "06" → 'WEST'), built from the same STATES_BY_REGION table. Throws on unknown FIPS, like regionForState. Plus a unit test covering all 51 FIPS ids.

DONE  Backend → 3D: `regionForFips(fips: string): Region` is in `lib/regions.ts` (tests in `lib/regions.test.ts`). It throws for the 5 territories in us-atlas (60, 66, 69, 72, 78), so the map must skip any feature that throws; `geoAlbersUsa` doesn't draw them anyway.

HANDOFF  from: 3D  to: Frontend
Need:    `PipelineLabels` (stage names, counts above each stack, region names under it, Store and In transit counts) and `RegionCard`, in components/dom/.
Why:     The stacks and map are drawn (M8) but unlabeled. Labels are DOM text (rule 5), mounted by 3D inside the Canvas with drei `<Html>` at the positions below.
Contract: `pipelineLayout(pipeline)` in components/three/pipelineLayout.ts returns `stacks: { stage: 'ordered'|'backorder'|'packed', region, count, x, base, w, h }[]` in layout units (y down, origin top-left of a PIPELINE_W x PIPELINE_H box; STORE and TRANSIT circles are exported too). Put a count at (x + w/2, base - h - ~12) and the region name at (x + w/2, base + ~12). Components take plain props (count, name), never fetch or compute status. 3D positions them; Frontend styles them (mono digits, tokens).

DONE  Frontend → 3D: `components/dom/PipelineLabels.tsx` (StackCount, RegionName, StageTitle, FlowNote, CircleLabel); 3D mounts them in `Pipeline.tsx`. Still open from the earlier handoff: `RegionCard` (M9).

HANDOFF  from: 3D  to: Frontend
Need:    Legend "Order" item becomes "Order day": a solid disc (on time) and a ring (late), with a note that size = orders that day.
Why:     The map now draws one bead per order day (D-011); the legend still shows a single small dot per order.
Contract: components/dom/Legend — shapes match mapShapes.ts beadGeometry (disc) and lateBeadGeometry (ring, inner radius 0.5).

DONE  Frontend → 3D: Legend "Order" is now "Order day": solid disc (on time), ring in the late color (inner radius 0.5, as lateBeadGeometry), and a small note "size = orders that day".
