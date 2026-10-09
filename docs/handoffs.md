
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

HANDOFF  from: Frontend  to: 3D
Need:    (1) Mount `<StoreButton />` (components/dom/PipelineLabels.tsx) at the Store circle in Pipeline.tsx in place of `<CircleLabel text="Store" />`, with pointer events on (the `Label` wrapper sets `pointerEvents: 'none'`). (2) When `useStore(s => s.pipelineCollapsed)` is true, collapse Ordered and Packed into one count each, ~300 ms. (3) Mount one `<RegionCard name count onTime late dimmed />` per region over the map from `useSummary().regions`. (4) Fade the other regions on the map when `selectedRegion` is set.
Why:     The DOM pieces and store are done; callouts ① and ② only work end to end once the scene reacts. Sidebar click, late list, and Escape already work.
Contract: `useStore` from lib/store (`selectedRegion`, `pipelineCollapsed`); `usePrefersReducedMotion()` from lib/hooks/usePrefersReducedMotion: when true, jump to the end state with no tween. `RegionCard` props: `{ name: string; count: number; onTime: number; late: number; dimmed?: boolean }`; pass `dimmed = selectedRegion !== null && selectedRegion !== region.id`.

DONE  3D → Frontend: callouts ① and ② are wired. `StoreButton` is pinned over the Store circle and collapses Ordered and Packed into a box with a total; `RegionCard` is mounted per region (DOM overlay in `CanvasLayer`); selecting a region fades the other regions on the map and their cards; reduced motion jumps to the end state. Escape and Tab/Enter were already in place.

HANDOFF  from: QA  to: Frontend
Need:    Let `SHOW_PIPELINE` in app/page.tsx be switched by an environment variable (for example `NEXT_PUBLIC_SHOW_PIPELINE === 'true'`), default still hidden.
Why:     Must-pass check 4 (click Store) needs the pipeline on. Today it is skipped, and running it means editing the source by hand. With an env switch, Playwright's web server could start with it on and the check runs on every `npm run test:e2e`.
Contract: default unchanged (hidden). e2e/must-pass.spec.ts is already skipped unless `E2E_PIPELINE=1`; playwright.config.ts would pass `NEXT_PUBLIC_SHOW_PIPELINE=true` to `next build` when that is set.

HANDOFF  from: 3D  to: Frontend
Need:    In components/dom/Legend.tsx, "Order day" should show only the late ring; drop the solid on-time disc and fix the comment that mentions `beadGeometry`.
Why:     The map no longer draws on-time beads (Kuko, design update), so the legend shows a symbol that is not on the map.
Contract: Map draws only `lateBeadGeometry` (ring, inner radius 0.5, late color). `beadGeometry` is gone from mapShapes.ts.

HANDOFF  from: 3D  to: Tech Lead
Need:    Log a decision in docs/wiki/14 (D-013): on-time order-day beads are no longer drawn; only late beads show. It narrows D-011 (4), which had on time = solid disc.
Why:     Decision log is Tech Lead's page; Kuko asked for this change on branch design-updates.
Contract: Layout (`laneLayout`) still places every day; only rendering in MapObjects.tsx skips on-time beads.

DONE  Frontend → 3D: week replay DOM half. `WeekControl` (bottom-left of the map) toggles `weekPlaying` and shows `weekDay`; store has `weekPlaying`, `weekDay`, `toggleWeekPlaying()`, `setWeekDay(n)`.

HANDOFF  from: Frontend  to: 3D
Need:    Run the weekly loop in the scene: while `weekPlaying`, animate order-day beads along their lanes, and call `setWeekDay(0..6)` whenever the day changes.
Why:     The button and counter are done but nothing moves yet.
Contract: `useStore` from lib/store (`weekPlaying`, `weekDay`, `setWeekDay`). With reduced motion, `WeekControl` does not render, so nothing can start the loop.

DONE  3D → Frontend: weekly loop runs (`WeekBeads`). The earlier request to drop the on-time disc from the Legend's "Order day" is withdrawn: the disc is drawn again while the loop plays, so the legend is correct as it is.

DONE  3D → Tech Lead: please log D-014 in docs/wiki/14: OPEN-09 is decided by Kuko: dots move, only as a play/pause weekly loop (off by default; wiki 11). D-013 (late-only still map) still applies to the still view.

HANDOFF  from: 3D  to: Frontend
Need:    In components/dom/Legend.tsx, "Order day" shows only the late ring (drop the solid disc), and fix the comment that mentions `beadGeometry` (it is gone).
Why:     Kuko decided on-time orders get no dot at all, still or playing (D-013). The weekly loop now moves only late rings, so the disc no longer appears anywhere on the map. This replaces the earlier note saying the legend was correct as is.
Contract: The map draws only `lateBeadGeometry` (ring, inner radius 0.5, late color).

DONE  Frontend → 3D: Legend "Late order day" now shows only the ring.
