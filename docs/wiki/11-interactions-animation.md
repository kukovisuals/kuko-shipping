# Interactions & Animation

> **Owner:** 3D + Frontend · **Status:** Draft · **Last updated:** 2026-10-07

## Purpose
What happens when the user clicks, hovers, or waits.

![State diagrams for pipelineCollapsed and selectedRegion](img/fig-interaction-states.svg)


## Callout ① — Click Store
- **Result:** Ordered and Packed stacks collapse into one count each.
- **State:** toggles `pipelineCollapsed`.
- **Motion:** stacks shrink vertically into a single bar over ~300 ms. Click again to expand.

![Before and after clicking Store: four stacks per stage become one count](img/story-callout-1.png)
*Captured from the real design.*


## Callout ② — Click a region in the sidebar
- **Result:** That region's late-orders list opens.
- **State:** sets `selectedRegion`.
- **Map response:** the selected region stays at full strength; the others fade.
- **Data:** fetch `/api/regions/[region]/late`.

![Before and after clicking West: the late-orders list opens](img/story-callout-2.png)
*Captured from the real design. The map fade is not in the design yet.*


## Hover (proposed)
- Hover a region on the map → its sidebar row highlights.
- Hover a destination → small tooltip with city and order count.

## Shipment motion
- **Open (OPEN-09):** Do dots move along lanes? How fast? Constantly, or only on load?
- Rule either way: motion must never hide the numbers. A CEO reads numbers, not animation.

## Reduced motion
If the user's system has "reduce motion" on, skip all animation and show the end state immediately.

## Keyboard
- Tab through sidebar rows; Enter opens the list.
- Escape closes the list and clears `selectedRegion`.

## Depends on
[3D Scene](10-three-scene.md) · [Frontend DOM](09-frontend-dom.md)
