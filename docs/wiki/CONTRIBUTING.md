# Contributing to the Wiki

> **Owner:** Tech Lead · **Status:** Accepted · **Last updated:** 2026-10-07

## The rules

1. **One owner per page.** Only the owner team edits a page's body.
2. **Want a change on someone else's page?** Add it to [Open Questions](15-open-questions.md) and tag the owner.
3. **Shared pages are append-only.** Glossary, Decisions Log, and Open Questions: add new entries, never rewrite someone else's.
4. **Cross-page changes start in the Decisions Log.** If your change affects another team's page, log the decision first. Then each owner updates their own page.
5. **Use Glossary terms exactly.** "Late" means what the Glossary says. Don't invent synonyms.
6. **Link, don't copy.** If a fact lives on another page, link to it. Copies drift apart.
7. **Numbers have one home.** Every number shown on the design comes from [Seed Data](06-seed-data.md).
8. **Mark unknowns.** Write `OPEN-xx` and add the question to Open Questions. Never guess silently.

![Flowchart of how a change moves through the wiki](img/fig-change-flow.svg)


## Page template

```md
# Page Title

> **Owner:** Team · **Status:** Draft | Proposed | Accepted · **Last updated:** YYYY-MM-DD

## Purpose
One sentence: what this page answers.

## Content
...

## Depends on
Links to pages this one relies on.

## Open items
OPEN-xx links.
```

## Why it's split this way

One big file means every team edits the same file, and changes collide.
One file per area means two teams can update the wiki at the same time without touching each other's work.
