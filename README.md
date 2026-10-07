# Shipping Tracker Wiki

A CEO-facing view that answers one question: **"How many orders are late for delivery?"**
Built with Next.js (full-stack) and React Three Fiber.

![The one-page design: title and Total on top; pipeline, US map and region summary below; legend at the bottom](docs/wiki/img/design-light.png)
*The one-page design this wiki describes. Dark version in the [Design Spec](docs/wiki/01-design-spec.md).*


---

## How this wiki works

- One page per area. Each page has **one owner team**.
- Teams edit **only their own pages**. This keeps updates independent.
- Shared pages (Glossary, Decisions Log, Open Questions) are **append-only**.
- Rules are in [CONTRIBUTING.md](docs/wiki/CONTRIBUTING.md).

## Current phase

**Phase 1 — Demo on fake data.** Concept target: Death Wish Coffee, made-up orders.
Numbers refresh on page load and on a timer. Real Shopify comes in Phase 2.

## Pages

![Map of which wiki page covers which layer of the app](docs/wiki/img/fig-wiki-map.svg)
*Where each page sits in the app. Data flows up from the seed (or Shopify) to the browser.*

| # | Page | Owner | Answers |
|---|------|-------|---------|
| 00 | [Product Overview](docs/wiki/00-product-overview.md) | Product | Who it's for, what's in and out of scope |
| 01 | [Design Spec](docs/wiki/01-design-spec.md) | Design | What every zone of the one-page design shows |
| 02 | [Glossary](docs/wiki/02-glossary.md) | Shared (append-only) | What each term means |
| 03 | [Architecture](docs/wiki/03-architecture.md) | Tech Lead | Stack, layers, data flow |
| 04 | [Setup](docs/wiki/04-setup.md) | DevEx | How to run the project locally |
| 05 | [Data Model](docs/wiki/05-data-model.md) | Backend | Tables and fields |
| 06 | [Seed Data](docs/wiki/06-seed-data.md) | Data | Fake data and the numbers it must hit |
| 07 | [Status Engine](docs/wiki/07-status-engine.md) | Backend | How an order gets its stage and timing |
| 08 | [API](docs/wiki/08-api.md) | Backend | Endpoints and response shapes |
| 09 | [Frontend DOM](docs/wiki/09-frontend-dom.md) | Frontend | Title, Total, sidebar, list, legend |
| 10 | [3D Scene](docs/wiki/10-three-scene.md) | 3D | Map, lanes, dots, stacks in R3F |
| 11 | [Interactions & Animation](docs/wiki/11-interactions-animation.md) | 3D + Frontend | Clicks, hovers, motion |
| 12 | [Shopify Integration](docs/wiki/12-shopify-integration.md) | Integrations | Phase 2: real store data |
| 13 | [Testing](docs/wiki/13-testing.md) | QA | What gets tested and how |
| 14 | [Decisions Log](docs/wiki/14-decisions-log.md) | Shared (append-only) | What was decided, when, why |
| 15 | [Open Questions](docs/wiki/15-open-questions.md) | Shared (append-only) | What still needs a decision |

## Status labels used on every page

- **Draft** — being written, may change.
- **Proposed** — ready for review.
- **Accepted** — agreed; change it only through the Decisions Log.


## Figures
- All figures live in `docs/wiki/img/`. SVGs follow the page's light/dark setting.
- They use the same fills as the design: solid = on time, hatched = late, dotted = in transit.
- Black `OPEN-xx` tags mark parts that are still undecided.
- Figures that show numbers use [Seed Data](docs/wiki/06-seed-data.md). If those numbers change, update the figures too.

