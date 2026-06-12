# World Cup AI Predictor

Predict FIFA World Cup 2026 match results with AI. Build your full bracket, get instant AI-powered analysis backed by real team stats, and share your picks with friends.

Live from June 11 to July 19, 2026. Covering USA, Canada and Mexico.

## Features

- **AI match predictions** using Groq (LLaMA) with real form, head-to-head and goals data
- **Resilient AI engine** — automatic fallback to a secondary model when rate limits hit, with cached predictions as a last resort
- **Full bracket builder** from Round of 32 to the Final — AI auto-fill or set every score yourself
- **Group stage tracker** with live standings and fixtures from API-Football
- **Shareable predictions** with rich link previews for X, WhatsApp and more
- **Auto-saved bracket** stored in the browser — no account needed to explore
- **Authentication** via Supabase (email/password and Google OAuth)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, GSAP 3 |
| Auth & DB | Supabase (`@supabase/ssr`) |
| AI | Groq SDK — LLaMA models |
| Data | API-Football (cached in Supabase) |
| State | Zustand v5 |
| Testing | Playwright |

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GROQ_API_KEY=
API_FOOTBALL_KEY=
```

Optional:

```
NEXT_PUBLIC_SITE_URL=   # Canonical URL for metadata, sitemap and OG images
```

### 3. Run database migrations

```bash
pnpm supabase db push
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # Production build
pnpm lint       # ESLint
pnpm test       # Playwright e2e tests
pnpm test:ui    # Playwright interactive UI
```

## Project Structure

```
app/
  api/           # Route handlers (fixtures, predict, standings)
  auth/          # Login and signup page
  bracket/       # Full tournament bracket builder
  dashboard/     # User dashboard
  groups/        # Group stage view with live standings
  predict/       # AI prediction form per match
  share/         # Shareable prediction pages
components/      # Reusable React components
lib/             # Utilities, Supabase clients, store, types
supabase/
  migrations/    # SQL migration files
tests/           # Playwright e2e tests
```

## Notes

- API-Football has a 100 requests/day limit on the free tier. Responses are cached in the `api_cache` Supabase table.
- All database tables have Row Level Security (RLS) enabled.
- Use `pnpm` only — not `npm` or `yarn`.

## CI / CD

A GitHub Actions workflow runs on every push and pull request to `main` / `dev`:

1. **Lint** — `pnpm lint`
2. **Type check** — `tsc --noEmit`
3. **Build** — `pnpm build`

This catches any error before Vercel deploys. If the workflow fails, Vercel will not receive a green signal and the deploy is blocked.

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in your GitHub repo and add:

| Secret | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `API_FOOTBALL_KEY` | api-football.com dashboard |
| `GROQ_API_KEY` | console.groq.com |

These are injected into the build step so `next build` has access to them without hardcoding anything.

### Vercel integration

Vercel runs its own build on deploy. Make sure the same four environment variables are also set in **Vercel → Project → Settings → Environment Variables** so production builds pass.

## Contributing

Contributions are welcome! If you'd like to improve the predictor:

1. **Fork** the repo and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/worldcup-ai-predictor.git
   ```
2. **Create a branch** from `develop`:
   ```bash
   git checkout -b feat/my-feature develop
   ```
3. **Make your changes** following the project conventions (see [AGENTS.md](AGENTS.md)) and use the commit message format:
   ```
   feat:     new feature
   fix:      bug fix
   chore:    tooling, deps, config
   test:     adding/updating tests
   refactor: code change without behavior change
   ```
4. **Verify before pushing** — these must pass with zero errors (same checks CI runs):
   ```bash
   pnpm lint
   pnpm exec tsc --noEmit
   pnpm build
   ```
5. **Open a Pull Request** against `develop` with a clear description of what you changed and why.

Found a bug or have an idea? [Open an issue](https://github.com/ivancidev/worldcup-ai-predictor/issues) — all feedback is appreciated.

## Author

Built by **Iván** ([@ivancidev](https://github.com/ivancidev))

If you find this project useful, a ⭐ on the repo is always welcome!
