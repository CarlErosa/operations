# Technology Stack

**Analysis Date:** 2026-08-25

## Languages

**Primary:**
- TypeScript 5.7.3 - All application code (`app/`, `components/`, `lib/`, `middleware.ts`)

**Secondary:**
- CSS (Tailwind CSS 4) - Styling via `app/globals.css` with CSS custom properties

## Runtime

**Environment:**
- Node.js (Next.js 16.3.0 server runtime)

**Package Manager:**
- npm (lockfile: `package-lock.json`) and pnpm (`pnpm-lock.yaml` present, `pnpm.overrides` in `package.json`)
- Both lockfiles exist; `pnpm` has a `pnpm.overrides` block pinning `hono` to `4.12.25`

## Frameworks

**Core:**
- Next.js 16.3.0 - App Router (`app/` directory), React 19, Server Components + Client Components
- React 19 / React DOM 19 - UI library

**UI:**
- shadcn/ui v4 (`base-nova` style) - Component library via `components.json`
- @base-ui/react 1.5.0 - Primitive used by Button component (`components/ui/button.tsx`)
- Tailwind CSS 4.3.3 - Utility CSS via `@tailwindcss/postcss` PostCSS plugin
- tw-animate-css 1.4.0 - Animation utilities
- class-variance-authority 0.7.1 - Variant-based className generation (Button)
- clsx 2.1.1 + tailwind-merge 3.3.1 - `cn()` utility at `lib/utils.ts`
- lucide-react 1.16.0 - Icon library

**Testing:**
- Not detected - No test framework, test files, or test scripts configured

**Build/Dev:**
- PostCSS 8.5 - CSS processing via `postcss.config.mjs`
- `next build` / `next dev` / `next start` scripts in `package.json`

## Key Dependencies

**Critical:**
- `@supabase/ssr` 0.12.5 - Supabase server-side rendering helpers (cookie-based auth)
- `@supabase/supabase-js` 2.112.4 - Supabase client SDK for database and auth
- `swr` 2.5.1 - Data fetching/caching on client side (used in `lib/store.tsx`)

**Infrastructure:**
- `@vercel/analytics` 1.6.1 - Vercel Analytics (production only, gated in `app/layout.tsx`)

## Configuration

**Environment:**
- `.env` file present at project root (contains `NEXT_PUBLIC_*` vars for Supabase)
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
  - `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Optional, used in sign-up for dev redirect
  - `NODE_ENV` - Controls cookie security flag and Analytics rendering

**Build:**
- `next.config.mjs` - TypeScript build errors ignored (`ignoreBuildErrors: true`), unoptimized images
- `tsconfig.json` - Strict mode, ES6 target, bundler resolution, `@/*` path alias
- `postcss.config.mjs` - Single plugin: `@tailwindcss/postcss`
- `components.json` - shadcn/ui config: `base-nova` style, RSC enabled, `@/components` aliases

## Platform Requirements

**Development:**
- Node.js 18+ (Next.js 16 requirement)
- Supabase project with `profiles`, `tracker_items`, `events`, `documents`, `decisions`, `escalations`, `activity` tables

**Production:**
- Vercel deployment (inferred from `@vercel/analytics` and v0.app generator metadata in `app/layout.tsx`)

---

*Stack analysis: 2026-08-25*
