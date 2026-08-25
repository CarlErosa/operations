# Codebase Structure

**Analysis Date:** 2026-08-25

## Directory Layout

```
operations/
├── app/                         # Next.js App Router routes
│   ├── auth/
│   │   ├── callback/route.ts    # OAuth/email code exchange
│   │   ├── error/page.tsx       # Auth failure page
│   │   ├── login/page.tsx       # Email/password sign-in
│   │   ├── sign-up/page.tsx     # Registration form
│   │   └── sign-up-success/page.tsx  # Post-registration confirmation
│   ├── globals.css              # Tailwind 4 + shadcn theme (oklch vars)
│   ├── layout.tsx               # Root HTML shell (Geist fonts, metadata)
│   └── page.tsx                 # Auth gate → OpsShell (server component)
├── components/
│   ├── auth/
│   │   └── auth-shell.tsx       # AuthShell, Field, inputClass exports
│   ├── ui/
│   │   ├── badge.tsx            # Badge with 7 tone variants
│   │   └── button.tsx           # Button with CVA variants (base-nova)
│   ├── views/
│   │   ├── dashboard-view.tsx   # Summary cards + activity feed
│   │   ├── tracker-view.tsx     # Deliverable table + status editor
│   │   ├── events-view.tsx      # Kanban pipeline + detail slide-over
│   │   ├── documents-view.tsx   # Document list + sign/fail/approve modals (694 lines)
│   │   ├── decisions-view.tsx   # Decision log + form modal
│   │   └── escalations-view.tsx # Unified escalation list
│   ├── app-sidebar.tsx          # Sidebar nav + sign-out + user badge
│   ├── ops-shell.tsx            # Client SPA shell (view router + StoreProvider)
│   └── page-header.tsx          # Sticky header with title + actions
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client (createBrowserClient)
│   │   ├── server.ts            # Server client (createServerClient + cookies)
│   │   └── proxy.ts             # Middleware client (session refresh)
│   ├── types.ts                 # Domain types + const arrays
│   ├── utils.ts                 # cn() helper (clsx + tailwind-merge)
│   ├── dates.ts                 # Date formatting, urgency, lead-time math
│   ├── mappers.ts               # Supabase row → app model converters
│   ├── store.tsx                # React Context + SWR store (295 lines)
│   ├── ui-maps.ts               # Domain → UI badge tone mappings
│   └── seed-data.ts             # Static demo data (unused in prod)
├── middleware.ts                 # Supabase session refresh + auth guard
├── next.config.mjs              # ignoreBuildErrors, unoptimized images
├── tsconfig.json                # Strict, bundler, @/* path alias
├── postcss.config.mjs           # @tailwindcss/postcss
├── components.json              # shadcn/ui config (base-nova style)
└── package.json                 # next 16.3, react 19, supabase, swr
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router routes and layout
- Contains: Page components (RSC), route handlers, global CSS, root layout
- Key files: `page.tsx` (auth gate + shell entry), `layout.tsx` (HTML shell), `globals.css` (theme)

**components/views/:**
- Purpose: Domain feature views — one per board section
- Contains: `"use client"` components, each self-contained with sub-components
- Key files: `documents-view.tsx` (694 lines, largest), `events-view.tsx` (253 lines)

**components/ui/:**
- Purpose: Reusable UI primitives from shadcn/ui
- Contains: `badge.tsx`, `button.tsx` only — two components installed
- Key files: `button.tsx` (uses @base-ui/react + CVA)

**lib/:**
- Purpose: Shared business logic, types, state management, utilities
- Contains: Type definitions, date helpers, data mappers, SWR store, UI mappings
- Key files: `store.tsx` (central state, 295 lines), `types.ts` (166 lines)

**lib/supabase/:**
- Purpose: Three Supabase client factories for different rendering contexts
- Contains: Browser client, server client, middleware client
- Key files: `proxy.ts` (session refresh logic, 70 lines)

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Root page — auth check, profile fetch, renders OpsShell
- `middleware.ts`: Request-level middleware — session refresh + redirect
- `app/auth/callback/route.ts`: OAuth/email callback handler

**Configuration:**
- `next.config.mjs`: Build config (ignoreBuildErrors, images)
- `tsconfig.json`: TypeScript config (strict, @/* alias)
- `postcss.config.mjs`: PostCSS (tailwind plugin)
- `components.json`: shadcn/ui (base-nova, aliases)

**Core Logic:**
- `lib/store.tsx`: Central state — SWR fetch + mutations + React Context
- `lib/types.ts`: All domain types and const arrays
- `lib/mappers.ts`: DB row → app model conversion
- `lib/dates.ts`: Date utilities and urgency calculations

**Testing:**
- Not detected — no test files, no test config, no test scripts

## Naming Conventions

**Files:**
- Views: `{domain}-view.tsx` (e.g., `dashboard-view.tsx`, `tracker-view.tsx`)
- UI primitives: lowercase noun (e.g., `badge.tsx`, `button.tsx`)
- Auth layout: `auth-shell.tsx` (noun-noun pattern)
- Utilities: lowercase (e.g., `utils.ts`, `dates.ts`, `mappers.ts`)

**Directories:**
- Lowercase, kebab: `auth/`, `sign-up/`, `sign-up-success/`
- Plural for feature groups: `views/`, `components/`

## Where to Add New Code

**New Feature View:**
- Create `components/views/{name}-view.tsx`
- Add `ViewKey` variant to `components/app-sidebar.tsx:20-26`
- Add nav entry to `NAV` array in `components/app-sidebar.tsx:28-35`
- Add view rendering in `components/ops-shell.tsx:28-33`
- Add store data/fetch in `lib/store.tsx` (fetchBoard + StoreValue)

**New Domain Type:**
- Add interface and const array to `lib/types.ts`
- Add mapper function to `lib/mappers.ts` (snake_case → camelCase)
- Add SWR fetch to `lib/store.tsx:fetchBoard()`

**New UI Component:**
- Place in `components/ui/` — use shadcn CLI (`npx shadcn add {component}`)
- Follow existing pattern: `cn()` for classes, exported component + variants

**New Utility:**
- Add to existing file if related (dates go to `lib/dates.ts`)
- Create new file in `lib/` only if meaningfully different domain

**New Auth Page:**
- Add route under `app/auth/{name}/page.tsx`
- Use `AuthShell` wrapper from `components/auth/auth-shell.tsx`

## Special Directories

**public/:**
- Purpose: Static assets (logos, placeholders, icons)
- Generated: No
- Committed: Yes
- Key files: `icpep_logo.jpg` (used in sidebar + auth), various placeholder images

**.planning/:**
- Purpose: GSD project management documents
- Generated: Yes (by GSD commands)
- Committed: Yes (by orchestrator)

---

*Structure analysis: 2026-08-25*
