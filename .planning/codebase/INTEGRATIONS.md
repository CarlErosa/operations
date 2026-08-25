# External Integrations

**Analysis Date:** 2026-08-25

## APIs & External Services

**Supabase (Database + Auth):**
- Full backend: database (PostgreSQL), authentication, row-level security
- SDK: `@supabase/supabase-js` 2.112.4, `@supabase/ssr` 0.12.5
- Auth: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- Three client factories:
  - `lib/supabase/client.ts` — Browser client via `createBrowserClient()`
  - `lib/supabase/server.ts` — Server client via `createServerClient()` with `cookies()` API
  - `lib/supabase/proxy.ts` — Middleware client for session refresh

**Vercel Analytics:**
- Package: `@vercel/analytics` 1.6.1
- Usage: Production-only in `app/layout.tsx` (gated by `NODE_ENV === 'production'`)
- No custom events or pages configuration

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` via three factory functions
  - Tables used (inferred from queries in `lib/store.tsx` and `lib/mappers.ts`):
    - `profiles` — User profile with `full_name`, `role` columns (`app/page.tsx`)
    - `tracker_items` — Deliverable tracking (`lib/store.tsx:52`)
    - `events` — Event pipeline (`lib/store.tsx:53`)
    - `documents` — Document workflow (`lib/store.tsx:54`)
    - `decisions` — Decision log (`lib/store.tsx:55`)
    - `escalations` — Cross-entity escalation flags (`lib/store.tsx:57`)
    - `activity` — Audit/activity log (`lib/store.tsx:56`)

**File Storage:**
- No file storage integration. Document "signing" captures only the filename string, not actual files.

**Caching:**
- SWR with `revalidateOnFocus: false` — client-side only, single `"board"` cache key (`lib/store.tsx:115`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password)
  - Sign in: `supabase.auth.signInWithPassword()` in `app/auth/login/page.tsx`
  - Sign up: `supabase.auth.signUp()` with email redirect in `app/auth/sign-up/page.tsx`
  - Sign out: `supabase.auth.signOut()` in `components/app-sidebar.tsx`
  - OAuth callback: Code exchange at `app/auth/callback/route.ts`
  - Session refresh: Middleware runs `supabase.auth.getUser()` on every non-static request (`lib/supabase/proxy.ts`)
  - Cookie security: `secure: process.env.NODE_ENV === 'production'` on all three clients

**Role System:**
- Custom role stored in `profiles` table: `President | Officer | Reviewer`
- Fallback to `Officer` if role missing (`app/page.tsx:20-23`)
- Role controls UI permissions (review/approve buttons in `components/views/documents-view.tsx`, escalation resolve in `components/views/escalations-view.tsx`)

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- `console.error` for sign-out failures only (`components/app-sidebar.tsx:51`)
- Activity table acts as application-level audit log

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `@vercel/analytics`, `generator: 'v0.app'` in metadata)

**CI Pipeline:**
- Not detected in repository

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

**Optional env vars:**
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` — Dev redirect override for sign-up flow
- `NODE_ENV` — Controls cookie security and analytics rendering

**Secrets location:**
- `.env` at project root (`.gitignore` excludes `.env*.local`, but `.env` itself is NOT gitignored)

## Webhooks & Callbacks

**Incoming:**
- `/auth/callback` route — OAuth/email confirmation callback from Supabase (`app/auth/callback/route.ts`)

**Outgoing:**
- Supabase auth email templates (for email confirmation flow)

## Database Schema (Inferred from Mappers)

**Escalation foreign keys** (in `lib/mappers.ts:17-19`):
- `escalations.event_id` → `events.id`
- `escalations.document_id` → `documents.id`
- `escalations.decision_id` → `decisions.id`

**Snake_case → camelCase mapping** (in `lib/mappers.ts`):
- DB columns use `snake_case` (e.g., `target_date`, `prepared_by`, `reviewed_by`, `fail_reason`, `signed_file_name`)
- App model uses `camelCase` (e.g., `targetDate`, `preparedBy`)

---

*Integration audit: 2026-08-25*
