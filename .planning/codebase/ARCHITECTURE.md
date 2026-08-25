<!-- refreshed: 2026-08-25 -->
# Architecture

**Analysis Date:** 2026-08-25

## System Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
│  app/layout.tsx          app/page.tsx                            │
│  app/auth/*              middleware.ts                            │
├─────────────────────────────────────────────────────────────────┤
│                      Client Shell Layer                          │
│  components/ops-shell.tsx  →  StoreProvider  →  AppSidebar       │
│  (SPA-style view switching via useState<ViewKey>)                │
├─────────┬─────────┬──────────┬──────────┬───────────┬───────────┤
│Dashboard│ Tracker │ Events   │ Documents│ Decisions  │Escalations│
│  view   │  view   │  view    │  view    │   view     │   view    │
└────┬────┴────┬────┴────┬─────┴────┬─────┴────┬──────┴─────┬─────┘
     │         │         │          │          │            │
     └─────────┴─────────┴────┬─────┴──────────┴────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   lib/store.tsx     │  ← SWR + React Context
                    │   (fetchBoard)      │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   lib/supabase/     │  ← Browser client
                    │   client.ts         │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Supabase (PG)     │  ← Database + Auth
                    │   tables: 7         │
                    └────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | HTML shell, fonts, metadata, analytics | `app/layout.tsx` |
| Root Page | Auth check, profile fetch, render shell | `app/page.tsx` |
| Middleware | Supabase session refresh, auth guard | `middleware.ts` |
| OpsShell | Client-side SPA: view router, store provider | `components/ops-shell.tsx` |
| AppSidebar | Navigation, sign-out, escalation badge, user info | `components/app-sidebar.tsx` |
| StoreProvider | Global state + SWR data fetching + mutation methods | `lib/store.tsx` |
| DashboardView | Summary cards, activity feed, attention items | `components/views/dashboard-view.tsx` |
| TrackerView | Deliverable table with inline status editor | `components/views/tracker-view.tsx` |
| EventsView | Kanban-style pipeline with detail slide-over | `components/views/events-view.tsx` |
| DocumentsView | Grouped document list, sign/fail/approve modals | `components/views/documents-view.tsx` |
| DecisionsView | Decision log table + form modal | `components/views/decisions-view.tsx` |
| EscalationsView | Unified escalation list with resolve action | `components/views/escalations-view.tsx` |

## Pattern Overview

**Overall:** Server-rendered shell → Client SPA with Context-based store

**Key Characteristics:**
- Server Component entry point (`app/page.tsx`) handles auth and profile fetch, then hands off to a client-side shell
- All view switching happens client-side via `useState<ViewKey>` in `OpsShell` — no client-side routing
- Single SWR fetch (`"board"` key) loads all data in parallel, stored in React Context
- Mutations call Supabase directly from the client, then `refresh()` (SWR `mutate()`)
- Activity logging is inline: each mutation writes to the `activity` table after the main operation

## Layers

**Server Layer (Next.js App Router):**
- Purpose: Authentication gate, initial data fetch, layout
- Location: `app/`, `middleware.ts`
- Contains: Route handlers, page components (RSC), middleware
- Depends on: `lib/supabase/server.ts`, `lib/supabase/proxy.ts`
- Used by: Browser

**Client Shell Layer:**
- Purpose: SPA view routing, global state provider, sidebar navigation
- Location: `components/ops-shell.tsx`, `components/app-sidebar.tsx`
- Contains: `"use client"` components, view switching logic
- Depends on: `lib/store.tsx`
- Used by: Server-rendered `app/page.tsx`

**View Layer:**
- Purpose: Domain-specific UI for each board section
- Location: `components/views/*.tsx`
- Contains: Feature views (dashboard, tracker, events, documents, decisions, escalations)
- Depends on: `lib/store.tsx` (via `useStore()`), `lib/dates.ts`, `lib/ui-maps.ts`, `components/ui/*`
- Used by: `components/ops-shell.tsx`

**State Layer:**
- Purpose: Centralized data fetching, caching, and mutation logic
- Location: `lib/store.tsx`
- Contains: React Context provider, SWR fetcher, mutation methods
- Depends on: `lib/supabase/client.ts`, `lib/mappers.ts`, `lib/types.ts`
- Used by: All view components via `useStore()`

**Data Layer:**
- Purpose: Supabase client factories and row-to-model mappers
- Location: `lib/supabase/`, `lib/mappers.ts`
- Contains: Browser client, server client, middleware client, mapper functions
- Depends on: `@supabase/ssr`, `@supabase/supabase-js`
- Used by: `lib/store.tsx`, `app/page.tsx`, `app/auth/callback/route.ts`, `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`, `components/app-sidebar.tsx`

## Data Flow

### Primary Data Load

1. Browser requests `/` → `middleware.ts` refreshes Supabase session via `lib/supabase/proxy.ts:4`
2. `app/page.tsx:7` — Server creates Supabase client, checks `getUser()`, redirects to `/auth/login` if unauthenticated
3. `app/page.tsx:14` — Fetches `profiles` table for `full_name` and `role`
4. `app/page.tsx:26` — Renders `<OpsShell>` (server component renders client boundary)
5. `components/ops-shell.tsx:24` — `<StoreProvider>` mounts, `lib/store.tsx:115` SWR calls `fetchBoard()`
6. `lib/store.tsx:50-57` — `fetchBoard()` fires 6 parallel Supabase queries, maps rows via `lib/mappers.ts`

### Mutation Flow (e.g., advance event stage)

1. User clicks "Move to next stage" → `components/views/events-view.tsx:237`
2. Calls `advanceEventStage(id)` from `lib/store.tsx:153`
3. `lib/store.tsx:159` — Direct Supabase `.update()` call
4. `lib/store.tsx:160` — Logs activity via `log()` helper
5. `lib/store.tsx:161` — Calls `refresh()` → SWR `mutate()` re-fetches entire board

**State Management:**
- React Context (`StoreContext`) provides all data and mutations to views
- SWR handles caching with `revalidateOnFocus: false`
- No optimistic updates — all mutations await Supabase, then re-fetch
- Single cache key `"board"` — entire board re-fetches on any mutation

## Key Abstractions

**StoreValue (lib/store.tsx:70-101):**
- Purpose: Typed interface for all global state and actions
- Pattern: Context Provider + custom hook (`useStore()`)

**Row Mappers (lib/mappers.ts):**
- Purpose: Convert Supabase snake_case rows to camelCase app model
- Pattern: One mapper per entity (`mapTracker`, `mapEvent`, `mapDocument`, `mapDecision`, `mapActivity`)
- Escalations are nested into parent entities via `escFor()` helper

**UI Maps (lib/ui-maps.ts):**
- Purpose: Map domain values to visual presentation (badge tones, colors)
- Pattern: Plain `Record` objects mapping domain types to UI values

**AuthShell (components/auth/auth-shell.tsx):**
- Purpose: Shared layout for auth pages (login, sign-up, error)
- Exports: `AuthShell` component, `Field` component, `inputClass` string constant

## Entry Points

**Root Page (`/`):**
- Location: `app/page.tsx`
- Triggers: HTTP GET request to `/`
- Responsibilities: Auth gate, profile fetch, render OpsShell

**Middleware:**
- Location: `middleware.ts`
- Triggers: Every non-static request (matcher in `middleware.ts:9-19`)
- Responsibilities: Supabase session refresh, redirect unauthenticated users

**Auth Callback:**
- Location: `app/auth/callback/route.ts`
- Triggers: GET from Supabase email confirmation / OAuth redirect
- Responsibilities: Exchange code for session, redirect to `/` or `/auth/error`

## Architectural Constraints

- **Single-threaded client state:** All view state and mutations flow through one React Context. No concurrent editing or offline support.
- **No server-side data fetching beyond auth:** The server only fetches `profiles`; all board data loads client-side via SWR.
- **Full re-fetch on mutation:** Every mutation triggers a complete re-fetch of all 6 tables (`refresh()` calls `mutate()` on the `"board"` key).
- **No optimistic updates:** UI waits for Supabase round-trip before updating.
- **`ignoreBuildErrors: true`:** TypeScript errors are suppressed in production builds (`next.config.mjs:4`).

## Anti-Patterns

### Duplicated `Field` Component

**What happens:** `Field` (label + children wrapper) is defined independently in three files: `components/auth/auth-shell.tsx:6`, `components/views/documents-view.tsx:401`, `components/views/decisions-view.tsx:226`.
**Why it's wrong:** Same component copied 3 times; changes to styling must be replicated in all three.
**Do this instead:** Extract to `components/ui/field.tsx` or reuse from `components/auth/auth-shell.tsx`.

### Module-level Supabase Client

**What happens:** `lib/store.tsx:35` creates `const supabase = createClient()` at module scope.
**Why it's wrong:** The comment in `lib/supabase/server.ts:5` explicitly warns against this for Fluid compute. Browser client at module scope is less critical but still creates a shared instance across all users in the same browser tab.
**Do this instead:** Create the client inside the `StoreProvider` or pass it via the SWR fetcher function.

### Unused RoleSwitcher Component

**What happens:** `components/app-sidebar.tsx:130-187` defines `RoleSwitcher` which is never rendered or exported.
**Why it's wrong:** Dead code; the role is now fetched from the `profiles` table server-side instead of being switched client-side.
**Do this instead:** Delete the `RoleSwitcher` component.

## Error Handling

**Strategy:** Minimal — user-facing error messages for auth failures only; no global error boundary.

**Patterns:**
- Auth errors: User-facing inline `<p className="text-sm text-danger">` messages (`app/auth/login/page.tsx:62`, `app/auth/sign-up/page.tsx:82`)
- Supabase mutation failures: No error handling — `.update()` / `.insert()` calls have no `.error` checks
- SWR errors: Not handled — no `onError` callback or error state rendering
- Sign-out failure: `console.error` only (`components/app-sidebar.tsx:51`)

## Cross-Cutting Concerns

**Logging:** Activity audit log via Supabase `activity` table. Each mutation writes an entry with `actor`, `message`, `kind`.

**Validation:** Client-side only, inline in form submit handlers. Examples: required fields (`documents-view.tsx:309-315`), PDF file type (`documents-view.tsx:164`), tier-gated reason requirement (`decisions-view.tsx:105-108`).

**Authentication:** Supabase Auth with email/password. Middleware refreshes session on every request. No role-based access control at the database level — role checks are UI-only.

---

*Architecture analysis: 2026-08-25*
