# Workflow — Cargo Atlas

## Daily loop

1. Pick the next open ticket in `docs/tickets.md`.
2. Read the spec section it points to (`docs/prompt-design.txt`) and, for Next.js work, the matching
   guide in `node_modules/next/dist/docs/`.
3. Domain rules first, with tests next to them. Then platform, engine, features, app.
4. Run the checks:

   ```bash
   npm run typecheck && npm test && npm run lint && npm run build
   ```

5. Fix what fails. Never silence an `arch/*` lint error; move the code.
6. Commit. The message starts with the ticket id: `M3: seed the Death Wish demo`.
7. Tick the ticket in `docs/tickets.md` in the same commit.

If the same fix fails 3 times, stop and write down what was tried.

## Branches and environments

| Where | Branch | Database | Site |
|-------|--------|----------|------|
| Local | any | Supabase **staging** | `localhost:3000` |
| Staging | `staging` | Supabase **staging** | staging domain (behind Vercel login) |
| Production | `main` | Supabase **production** | cargoatlas.app |

Flow: local → `staging` → owner OK → migration on production → `main`.
Nothing in progress touches production.

## Migrations

- One file per change: `supabase/migrations/NNNN_name.sql`, numbered, never edited after it runs.
- Once in production, migrations only add. Renaming or dropping takes two releases.
- The owner runs SQL in the Supabase editor. Every request names the **project** (staging or
  production), the file, and the editor link. Production only at release.
- After copying data between projects, check that `anon` can run none of the functions
  (`has_function_privilege('anon', …)`).

## Secrets

- Keys live in `.env.local` (local) and Vercel env vars. `.env.example` lists the names.
- Never commit `.env.local`; never put a key in code. `SUPABASE_SERVICE_ROLE_KEY` is server-only and
  marked sensitive in Vercel.

## Demo data

- `npm run seed:demo` rebuilds the Death Wish demo with seed `4242`. Dates are relative to the day it
  runs, so re-run it before a pitch to keep the late and at-risk stories true.

## What the owner does (Claude gives the steps)

Supabase and Vercel projects, `.env.local` keys, SQL in the Supabase editor, Resend + SMTP, the
Natural Earth land file if the download is blocked, Vercel firewall rule (10/min per IP on
`POST /api/auth/*`), and real-phone checks.

## Notes

- `next dev` keeps a managed Next.js block in `AGENTS.md`. Commit it when it changes; leave
  `CLAUDE.md` for project rules.
- Restart `next dev` after adding a new `[param]` route folder.
