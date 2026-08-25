# Codebase Concerns

**Analysis Date:** 2026-08-25

## Tech Debt

**Supabase mutations lack error handling:**
- Issue: Every `.update()`, `.insert()`, and `.delete()` call in `lib/store.tsx` ignores the `error` return. If Supabase returns an error, the UI silently re-fetchs stale data.
- Files: `lib/store.tsx:147,159,167-168,178-183,193-195,206-210,221-226,233-238,245-257,267-269`
- Impact: Silent data loss — user thinks action succeeded but data wasn't persisted
- Fix approach: Check `.error` on each call, surface to user via error state, and optionally toast/notification

**Duplicated `Field` component across three files:**
- Issue: Identical `Field` (label + children wrapper) defined in `components/auth/auth-shell.tsx:6`, `components/views/documents-view.tsx:401`, `components/views/decisions-view.tsx:226`
- Files: Three separate implementations with identical markup
- Impact: Style changes must be replicated in three places; any inconsistency creates visual bugs
- Fix approach: Extract to `components/ui/field.tsx` or reuse `auth-shell.tsx`'s `Field` everywhere

**Module-level Supabase client in store:**
- Issue: `lib/store.tsx:35` creates a browser Supabase client at module scope (`const supabase = createClient()`). This shared instance persists across the session.
- Files: `lib/store.tsx:35`
- Impact: Works for single-user browser tabs but violates Supabase SSR guidance. Could cause stale auth state if session refresh happens without page reload.
- Fix approach: Move `createClient()` inside `fetchBoard()` or `StoreProvider`

**TypeScript build errors suppressed:**
- Issue: `next.config.mjs:4` sets `ignoreBuildErrors: true`, meaning type errors don't block deployment.
- Files: `next.config.mjs:4`
- Impact: Type bugs ship to production undetected
- Fix approach: Remove `ignoreBuildErrors`, fix any type errors that surface

**Mapper functions use `any` type:**
- Issue: All mapper functions in `lib/mappers.ts` accept `row: any` — no type safety on DB input
- Files: `lib/mappers.ts:28,40,53,70,82`
- Impact: Column renames or missing fields won't be caught at compile time
- Fix approach: Define Supabase row types or use generated types from Supabase CLI

**Dead `RoleSwitcher` component:**
- Issue: `components/app-sidebar.tsx:130-187` defines `RoleSwitcher` which is never imported or rendered anywhere
- Files: `components/app-sidebar.tsx:130-187`
- Impact: Dead code adds maintenance burden and confusion
- Fix approach: Delete the component

## Known Bugs

**No known bugs identified from code review.**

## Security Considerations

**Client-side only role enforcement:**
- Risk: Role checks (`canReview`, `canApprove`, `isPresident`) are UI-only in `components/views/documents-view.tsx:48-49` and `components/views/escalations-view.tsx:52`. A user could call Supabase API directly to bypass these.
- Files: `components/views/documents-view.tsx:48-49`, `components/views/escalations-view.tsx:52`, `lib/store.tsx` (no role checks on mutations)
- Current mitigation: Supabase row-level security may enforce this at the database level (not verifiable from frontend code alone)
- Recommendations: Verify Supabase RLS policies exist for `documents`, `decisions`, `escalations` tables. Add server-side role checks if RLS is not configured.

**`.env` not fully gitignored:**
- Risk: `.env` file (not `.env.local`) is present at project root and not excluded by `.gitignore` (only `.env*.local` is ignored). Contains `NEXT_PUBLIC_*` vars which are public by design, but the pattern is fragile.
- Files: `.gitignore:10`, `.env` (existence noted, contents not read)
- Current mitigation: `NEXT_PUBLIC_*` vars are meant to be public; anon key is not a secret
- Recommendations: Move sensitive vars to `.env.local` or add `.env` to `.gitignore` if any non-public vars are added later

**No CSRF protection beyond Supabase defaults:**
- Risk: Forms submit directly to Supabase from client. Supabase anon key is exposed in the bundle.
- Files: `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`, `lib/store.tsx`
- Current mitigation: Supabase anon key is designed to be public; RLS is the security boundary
- Recommendations: Ensure RLS policies are comprehensive

## Performance Bottlenecks

**Full board re-fetch on every mutation:**
- Problem: Every single mutation (status update, stage advance, document add, etc.) calls `refresh()` which re-fetches all 6 Supabase tables via `fetchBoard()`.
- Files: `lib/store.tsx:132` (refresh), called from every mutation at lines 151,161,172,187,198,214,229,241,263,272
- Cause: No optimistic updates or granular cache invalidation — simple approach trades latency for simplicity
- Improvement path: Add optimistic UI updates via SWR's `mutate()` with data, or use targeted re-fetch

**6 parallel Supabase queries on initial load:**
- Problem: `fetchBoard()` at `lib/store.tsx:50-57` fires 6 queries simultaneously including `escalations` (all rows) and `activity` (last 50)
- Files: `lib/store.tsx:49-68`
- Cause: Simple approach — fetch everything at once
- Improvement path: Split into critical (tracker, events, documents) and secondary (activity, escalations) with staggered loading

## Fragile Areas

**Document state machine:**
- Files: `lib/store.tsx:164-229`, `components/views/documents-view.tsx:481-544`
- Why fragile: Stage transitions are guarded by inline checks (`if (!d || d.stage !== "Reviewing") return`) rather than a centralized state machine. Adding a new stage or modifying transitions requires updating multiple files.
- Safe modification: Create a `canTransition(from, to)` helper or state machine object in `lib/types.ts` or a new `lib/document-machine.ts`
- Test coverage: None

**Event stage progression:**
- Files: `lib/store.tsx:153-161`, `components/views/events-view.tsx:131-132`
- Why fragile: Uses array index arithmetic (`EVENT_STAGES.indexOf` + `Math.min(idx + 1, ...)`) rather than explicit state machine
- Safe modification: Ensure `EVENT_STAGES` array order in `lib/types.ts` is never changed; any reorder silently changes the pipeline
- Test coverage: None

## Scaling Limits

**SWR single-key cache:**
- Current capacity: Entire board in one SWR cache key (`"board"`) — works for current ~20 items
- Limit: As data grows (hundreds of tracker items, events, documents), initial load time and mutation re-fetch cost increase linearly
- Scaling path: Split into per-entity SWR keys with independent refresh

**Activity log unbounded:**
- Current capacity: Fetches last 50 activity entries (`lib/store.tsx:56`)
- Limit: No pagination; activity table grows indefinitely
- Scaling path: Add pagination or cursor-based loading in the activity section

## Dependencies at Risk

**`@base-ui/react`:**
- Risk: Used only by `components/ui/button.tsx` as the button primitive. This is a newer library (v1.5.0) from the Base UI project.
- Impact: If abandoned or breaking changes ship, only the Button component is affected
- Migration plan: Replace with native `<button>` element or shadcn's standard Button implementation

**`pnpm.overrides` for `hono`:**
- Risk: `package.json` pins `hono` to `4.12.25` via pnpm overrides, but `hono` is not a direct dependency
- Impact: Likely a transitive dependency conflict resolution; could mask version issues
- Migration plan: Investigate why the override exists; remove if the underlying conflict is resolved

## Missing Critical Features

**No test suite:**
- Problem: Zero tests of any kind (unit, integration, e2e)
- Blocks: Confidence in refactoring, regression detection, CI/CD deployment gates

**No error boundary:**
- Problem: No React error boundary wraps the app. An unhandled error in any view crashes the entire shell.
- Blocks: Graceful degradation; current state shows a blank page on JS errors

**No loading/skeleton states:**
- Problem: SWR `isLoading` is only used to pass to the store value; no skeleton UI is shown during initial load
- Blocks: Perceived performance during 6-query initial fetch

## Test Coverage Gaps

**All code is untested:**
- What's not tested: Everything — types, dates, mappers, store mutations, all view components, auth flow
- Files: All `.ts` and `.tsx` files in `lib/`, `components/`, `app/`
- Risk: Silent regressions on any code change; no safety net for refactoring
- Priority: High

---

*Concerns audit: 2026-08-25*
