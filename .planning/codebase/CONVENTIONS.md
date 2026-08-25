# Coding Conventions

**Analysis Date:** 2026-08-25

## Naming Patterns

**Files:**
- Views: `{domain}-view.tsx` kebab-case with `-view` suffix (e.g., `dashboard-view.tsx`, `tracker-view.tsx`)
- UI components: lowercase noun (`badge.tsx`, `button.tsx`)
- Lib modules: lowercase (`utils.ts`, `dates.ts`, `mappers.ts`, `types.ts`, `seed-data.ts`)
- Auth: `auth-shell.tsx` (noun-noun)

**Functions:**
- camelCase for all functions (e.g., `createClient`, `fetchBoard`, `mapTracker`, `formatDate`)
- React components: PascalCase (e.g., `OpsShell`, `TrackerView`, `StatusEditor`, `EventCard`)
- Mapper functions: `map{Entity}` prefix (e.g., `mapTracker`, `mapEvent`, `mapDocument`)
- Hook-style: `useStore` pattern for Context consumer

**Variables:**
- camelCase for all variables (e.g., `currentUserName`, `ownerFilter`, `statusFilter`)
- UPPER_SNAKE for constants: `TODAY`, `NAV`, `ROLES`, `EVENT_STAGES`, `TRACKER_STATUSES`
- Records/mapping objects: camelCase (e.g., `statusTone`, `tierTone`, `departmentColor`, `activityMeta`)

**Types:**
- PascalCase for interfaces and types: `Role`, `Department`, `TrackerItem`, `EventItem`, `StoreValue`
- Type arrays: UPPER_SNAKE matching the type name (e.g., `ROLES`, `DEPARTMENTS`, `EVENT_STAGES`)
- Union type constants exported alongside their type: `export type Role = "President" | "Officer" | "Reviewer"` with `export const ROLES: Role[] = [...]`
- `Record<K, V>` for mapping types: `Record<TrackerStatus, BadgeTone>`

## Code Style

**Formatting:**
- No Prettier or ESLint config detected — code appears to use default/consistent formatting
- 2-space indentation throughout
- Single quotes for strings in library code (`lib/supabase/*.ts`)
- Double quotes in components and app routes (mixed — Supabase files use single, React files use double)
- Trailing commas in object/array literals (consistent)

**Linting:**
- No `.eslintrc`, `eslint.config.*`, or `biome.json` detected
- No lint scripts in `package.json`

**TypeScript:**
- `strict: true` in `tsconfig.json`
- `ignoreBuildErrors: true` in `next.config.mjs` — TS errors suppressed at build time
- Liberal use of `any` in mapper functions (`lib/mappers.ts:28,40,53,70,82` — `row: any`)

## Import Organization

**Order:**
1. React/Next.js imports (`useState`, `useRouter`, `redirect`, `Link`)
2. Third-party libraries (`lucide-react`, `swr`, `class-variance-authority`)
3. Local components (`@/components/*`)
4. Local utilities (`@/lib/*`)

**Path Aliases:**
- `@/*` → project root (e.g., `@/components/ops-shell`, `@/lib/store`, `@/lib/types`)
- All imports use `@/` prefix consistently — no relative imports except within the same directory

## Error Handling

**Patterns:**
- Auth errors: User-facing inline text (`<p className="text-sm text-danger">`)
- Form validation: Inline state `error` string, set before return, rendered conditionally
- Supabase mutations: No `.error` checking on `.update()`, `.insert()`, `.delete()` calls
- SWR: No error state handling

**Typical form pattern:**
```tsx
const [error, setError] = useState<string | null>(null)

function submit() {
  if (!value.trim()) {
    setError("Required message")
    return
  }
  // do work
  onClose()
}

// In JSX:
{error && <p className="text-sm text-danger">{error}</p>}
```

## Logging

**Framework:** None (no structured logging library)

**Patterns:**
- Activity audit log via Supabase `activity` table (application-level, not console)
- `console.error` used once for sign-out failure (`components/app-sidebar.tsx:51`)
- `console.log` with `[v0]` prefix used once (same file, line 51)

## Comments

**When to Comment:**
- Supabase integration notes: Boilerplate comments from Supabase SSR examples (`lib/supabase/proxy.ts`, `lib/supabase/server.ts`)
- Domain logic: Brief inline comments explaining non-obvious calculations (`lib/dates.ts:40`, `lib/types.ts:58`)
- One TODO-style comment: `// ponytail: this exists` pattern not present

**JSDoc/TSDoc:**
- Single JSDoc block in `lib/supabase/server.ts:4-8` warning about Fluid compute
- No other JSDoc usage

## Function Design

**Size:** View components range from 115 lines (escalations) to 694 lines (documents). Helper sub-components are defined in the same file.

**Parameters:**
- React components: Typed props inline in function signature (no separate Props interfaces, except `RoleSwitcher`)
- Utility functions: Simple positional params with type annotations
- Mapper functions: `(row: any, esc?: EscalationRow[])` — loose typing on DB rows

**Return Values:**
- Components return JSX directly
- Mappers return typed domain objects
- Store mutations return `Promise<void>` (fire-and-forget with `refresh()`)

## Module Design

**Exports:**
- Named exports exclusively — no default exports except page components (required by Next.js)
- Auth shell exports multiple items: `AuthShell`, `Field`, `inputClass`
- `lib/utils.ts` exports single `cn()` function
- `lib/types.ts` exports both types and const arrays from same file

**Barrel Files:**
- None — no `index.ts` files anywhere

## Component Patterns

**"use client" directive:**
- Present at top of any file using hooks or browser APIs
- Server Components: `app/page.tsx`, `app/auth/error/page.tsx`, `app/auth/sign-up-success/page.tsx`, `components/page-header.tsx`, `components/auth/auth-shell.tsx`, `components/ui/badge.tsx`
- Client Components: `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`, `components/ops-shell.tsx`, `components/app-sidebar.tsx`, all `components/views/*.tsx`

**Modal/Dialog pattern:**
- State-driven: `const [open, setOpen] = useState(false)`
- Rendered conditionally with fixed overlay (`<div className="fixed inset-0 z-30">`)
- Backdrop: `<div className="absolute inset-0 bg-foreground/20" onClick={onClose}>`
- No dialog primitive used — manual overlay implementation

**Dropdown pattern:**
- State-driven open/close with `useRef` + `useEffect` click-outside handler
- Manual `addEventListener("mousedown", ...)` for click-outside detection
- Repeated in `StatusEditor` (`tracker-view.tsx:149-204`) and `RoleSwitcher` (`app-sidebar.tsx:130-187`)

---

*Convention analysis: 2026-08-25*
