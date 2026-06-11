<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# World Cup AI Predictor — Agent Rules

## Project Overview

A Next.js 16 + React 19 app that lets users predict World Cup 2026 match results using AI (Groq/LLaMA). Authentication and data persistence via Supabase. Match data fetched from API-Football.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| UI | React 19, Tailwind CSS v4, GSAP 3 |
| Auth & DB | Supabase (`@supabase/ssr` v0.12) |
| AI | Groq SDK (`groq-sdk`) — LLaMA models |
| State | Zustand v5 |
| Icons | Lucide React |
| Testing | Playwright |
| Package manager | **pnpm** — never use npm or yarn |

## Project Structure

```
app/
  api/           # Route handlers (fixtures, predict, standings, etc.)
  auth/          # Auth page (login/signup)
  bracket/       # Tournament bracket view
  dashboard/     # User dashboard
  groups/        # Group stage view
  predict/       # Prediction form per match
  share/         # Shareable prediction pages
components/      # Reusable React components
lib/             # Utilities, Supabase clients, data helpers
supabase/
  migrations/    # SQL migration files — always version these
tests/           # Playwright e2e tests
```

## Key Conventions

### Next.js App Router
- All pages are Server Components by default — add `"use client"` only when needed (event handlers, hooks, browser APIs)
- Supabase server client: use `lib/supabase/server.ts` in Server Components and Route Handlers
- Supabase browser client: use `lib/supabase/client.ts` in Client Components
- Read `node_modules/next/dist/docs/` for any API you're unsure about — this version differs from training data

### Environment Variables
- Public (browser-safe): prefix with `NEXT_PUBLIC_`
- Server-only: `API_FOOTBALL_KEY`, `GROQ_API_KEY`
- Reference `.env.example` for all required vars — never hardcode secrets

### API Routes
- Located in `app/api/*/route.ts`
- Use `api_cache` Supabase table to cache API-Football responses (100 req/day limit on free tier)
- Return consistent `{ data, error }` shape

### Database
- Row Level Security (RLS) is enabled on all tables — always add policies when creating tables
- New migrations go in `supabase/migrations/` with sequential numbering: `002_...sql`, `003_...sql`
- Never modify existing migration files — create new ones instead

### Styling
- Tailwind CSS v4 — syntax differs from v3, check docs before using
- GSAP for animations — register plugins before use
- No inline styles — use Tailwind or CSS modules

### Testing
- Playwright configured in `playwright.config.ts`
- Tests in `tests/` directory
- Run: `pnpm test` | UI mode: `pnpm test:ui`

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Playwright e2e tests
pnpm test:ui      # Playwright interactive UI
```

## What NOT to do

- ❌ Don't use `npm` or `yarn` — use `pnpm`
- ❌ Don't bypass RLS with `service_role` key in client-side code
- ❌ Don't call API-Football directly without checking `api_cache` first
- ❌ Don't add secrets to `.env.example` — only placeholder values
- ❌ Don't modify existing migration files — always create new ones
- ❌ Don't use `any` type in TypeScript — be explicit

## Before Finishing Any Task

**ALWAYS run these three commands in order before considering a task complete.** Fix every error they report before finishing.

```bash
pnpm lint              # must pass with zero errors
pnpm exec tsc --noEmit # must pass with zero type errors
pnpm build             # must complete without errors
```

This mirrors exactly what `.github/workflows/ci.yml` runs on every push. If any of these fail locally, the GitHub Action will also fail and Vercel will block the deployment.
