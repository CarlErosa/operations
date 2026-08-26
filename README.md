# ICPEP.SE Operations Dashboard

An internal operations workspace for **ICPEP.SE–PUP** — a single place for the exec team to track deliverables, run the event pipeline, manage document sign-offs, log decisions, and flag escalations that need President attention.

Built with [v0](https://v0.app) and backed by [Supabase](https://supabase.com) (Postgres + Auth).

## Features

- **Dashboard** — summary cards, recent activity feed, and items that need attention
- **Tracker** — deliverable table with owner, reviewer, target date, and inline status editing
- **Events** — kanban-style pipeline (Concept → Logistics/GPOA → Marketing Plan → Internal Review → Final Approval → Execution → Post-Event Report), with a detail slide-over per event
- **Documents** — grouped document workflow (Draft → Reviewing → Reviewed → Up for Approval → Approved) with sign, fail, and approve actions
- **Decisions** — a decision log with a tiered (1–3) severity model and required rationale for higher tiers
- **Escalations** — a unified view of everything flagged across events, documents, and decisions
- Role-aware UI for **President**, **Reviewer**, and **Officer** accounts
- A hidden Tetris easter egg in the sidebar, with scores saved per user

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- [Supabase](https://supabase.com) for Postgres, Auth, and row-level security
- Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com) (`base-nova` style)
- [SWR](https://swr.vercel.app) for client-side data fetching/caching

## Prerequisites

- Node.js 18+
- A Supabase project with the following tables (not currently checked into this repo — see [Database setup](#database-setup)):
  `profiles`, `tracker_items`, `events`, `documents`, `decisions`, `escalations`, `activity`, `tetris_scores`

## Getting started

1. Install dependencies:

   ```bash
   npm install
   # or pnpm install
   ```

2. Create a `.env.local` file in the project root with your Supabase credentials:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # optional — overrides the email-confirmation redirect target in dev
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/auth/login` until you sign in.

## Database setup

The app expects a Supabase project with these tables (columns are inferred from `lib/mappers.ts` and `lib/store.tsx`):

| Table | Purpose |
|---|---|
| `profiles` | `full_name`, `role` (`President` \| `Officer` \| `Reviewer`) per user |
| `tracker_items` | Deliverables: `deliverable`, `owner`, `reviewer`, `target_date`, `status`, `blockers` |
| `events` | Event pipeline: `name`, `department`, `stage`, `owner`, `target_date`, `notes` |
| `documents` | Document workflow: `title`, `type`, `stage`, `prepared_by`, `reviewed_by`, `approved_by`, `version_date`, plus file name/path fields |
| `decisions` | `description`, `tier`, `decided_by`, `date`, `reason` |
| `escalations` | `reason`, `resolved`, plus one of `event_id` / `document_id` / `decision_id` |
| `activity` | Audit log: `actor`, `message`, `kind`, `created_at` |
| `tetris_scores` | `user_id`, `name`, `score` (for the sidebar easter egg) |

Row-level security should be configured so that write access (especially on `documents`, `decisions`, and `escalations`) matches the role rules the UI enforces — the frontend does **not** re-check roles against the database, so RLS is the actual security boundary. There are no migration files in this repo yet; schema currently lives only in the connected Supabase project.

## Scripts

```bash
npm run dev     # start the dev server (Turbopack)
npm run build   # production build
npm run start   # run the production build
```

There is no lint or test script configured yet.

## Project structure

```
app/                      # Next.js App Router routes
  auth/                   # login, sign-up, callback, error pages
  page.tsx                # auth gate → fetches profile → renders OpsShell
components/
  ops-shell.tsx           # client-side SPA shell (view switching, no router)
  app-sidebar.tsx         # nav, sign-out, Tetris easter egg
  views/                  # one file per section (dashboard, tracker, events, ...)
  auth/, ui/              # auth layout + shadcn primitives
lib/
  store.tsx               # SWR + React Context: single source of truth for board data
  supabase/                # browser / server / middleware Supabase client factories
  types.ts                # domain types + the const arrays that drive dropdowns/filters
  mappers.ts               # Supabase row (snake_case) → app model (camelCase)
  seed-data.ts             # static demo data (not wired into the app)
middleware.ts              # refreshes the Supabase session on every request
```

## Known issues / QA notes

A few things worth fixing before this gets much bigger:

- **Two type mismatches ship silently.** `next.config.mjs` sets `typescript: { ignoreBuildErrors: true }`, so `next build` succeeds even though `npx tsc --noEmit` currently reports 4 errors:
  - `EventStage` in `lib/types.ts` still lists `"Logistics"`, but `EVENT_STAGES`, `seed-data.ts`, and the rest of the app all use `"Logistics/GPOA"`. Fix the type to match.
  - `decisions-view.tsx` does `useState(role)` for the "Decided by" field, so TypeScript infers its type as `Role` instead of `string` — then flags the free-text `onChange` handler. Should be `useState<string>(role)`.
  - `lib/mappers.ts`'s `escFor()` passes a raw `string` through for `Escalation.reason`, which is actually typed as a closed union (`EscalationReason`). Worth validating/narrowing at the mapper boundary.
- **Supabase mutations don't check `.error`.** Every `.update()` / `.insert()` in `lib/store.tsx` assumes success and just calls `refresh()`. A failed write currently looks like a successful one to the user.
- **No test suite** — no framework, no test files, no test script.
- **Some dead/duplicated code**: `RoleSwitcher` in `app-sidebar.tsx` is defined but never rendered; the `Field` label-wrapper component is copy-pasted in three separate files instead of shared.
- **No `.env.example`** in the repo, so a new contributor has to reverse-engineer the required env vars from `lib/supabase/*.ts`. Consider committing one (documented above).
- **No schema/migrations in-repo** — the 8 tables above only exist in whatever Supabase project this is currently pointed at.
- Next.js 16 flags the `middleware.ts` convention as deprecated in favor of `proxy.ts`; it still works but will likely need to migrate (`npx @next/codemod@canary middleware-to-proxy .`).
- `next/font/google` fetches Geist and Geist Mono at build time — a build will fail in any environment without outbound access to `fonts.googleapis.com` (e.g. an offline CI runner). Self-hosting the fonts with `next/font/local` would remove that dependency.

None of the above blocked `npm install` or `npm run dev` — the app runs. They're type-safety, security, and maintainability gaps rather than functional breakage.
