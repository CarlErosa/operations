# Testing Patterns

**Analysis Date:** 2026-08-25

## Test Framework

**Runner:**
- Not detected — no test framework configured

**Assertion Library:**
- Not detected

**Run Commands:**
```bash
# No test scripts defined in package.json
# Only: "dev", "build", "start"
```

## Test File Organization

**Location:**
- No test files exist in the repository

**Naming:**
- No `*.test.*` or `*.spec.*` files found

## Test Configuration

- No `jest.config.*`, `vitest.config.*`, or any test config files
- No test-related dependencies in `package.json`
- No test scripts in `package.json` `"scripts"` block

## What Exists

**E2E/Manual:**
- The app has a complete auth flow (login, sign-up, callback, error) that could serve as manual E2E verification
- Role-based UI gating (`President` / `Reviewer` / `Officer`) is verifiable through the UI
- SWR data fetching with Supabase provides real-time data in the browser

**Implicit Verification:**
- TypeScript `strict: true` in `tsconfig.json` provides compile-time type checking (though `ignoreBuildErrors: true` suppresses this at build)
- Supabase row-level security (assumed, not verified from code) provides data-level access control

## Testing Gaps

**No unit tests for:**
- `lib/dates.ts` — Date formatting, urgency calculations, lead-time deadlines (complex logic, high value for tests)
- `lib/mappers.ts` — Row-to-model conversion (pure functions, easy to test)
- `lib/store.tsx` — Mutation logic and state transitions
- `lib/ui-maps.ts` — Mapping completeness (all domain values covered)

**No component tests for:**
- Form validation logic in documents, decisions, auth views
- Status transition logic (can only move forward in event stages, document stage gates)
- Role-based rendering (President-only buttons, reviewer-only actions)

**No integration tests for:**
- Auth flow (login → session → middleware refresh → redirect)
- SWR fetch and mutation cycle
- Supabase client creation across contexts (browser, server, middleware)

## Recommended Test Strategy (if tests are added)

**Priority 1 — Pure functions (highest ROI):**
- `lib/dates.ts`: `formatDate`, `daysUntil`, `isThisWeek`, `isOverdue`, `urgencyOf`, `relativeLabel`, `leadTimeDeadline`
- `lib/mappers.ts`: All mapper functions with mock row data

**Priority 2 — Store mutations:**
- `lib/store.tsx` action logic: stage advancement guards, document state machine, escalation resolution

**Priority 3 — Component behavior:**
- Form validation in documents-view and decisions-view
- Filter logic in tracker-view

---

*Testing analysis: 2026-08-25*
