@AGENTS.md

# Claude-Specific Notes

> `CLAUDE.md` is read exclusively by Claude (Anthropic). Rules in `AGENTS.md` apply to all agents including Claude.

## Claude Code Behavior

- Always check `node_modules/next/dist/docs/` before using any Next.js API — this is Next.js 16 with breaking changes from previous versions
- Use the `next-best-practices` skill (`.agents/skills/next-best-practices/`) for Next.js patterns
- Use the `gsap-react` skill when adding GSAP animations in React components
- Prefer `multi_replace_file_content` over full file rewrites for targeted edits

## Supabase Client Usage

```ts
// Server Components / Route Handlers → use server client
import { createClient } from "@/lib/supabase/server";

// Client Components → use browser client
import { createClient } from "@/lib/supabase/client";
```

## Groq / AI Calls

- All AI calls go through `app/api/predict/route.ts`
- Model: check the route handler for the current model in use — do not assume
- Keep prompts in the route handler, not scattered across components

## Database Changes

Always create a new migration file, never edit existing ones:
```
supabase/migrations/001_initial_schema.sql  ← never touch
supabase/migrations/002_your_change.sql     ← new file
```

## Commit Message Convention

```
feat:   new feature
fix:    bug fix
chore:  tooling, deps, config
test:   adding/updating tests
refactor: code change without behavior change
```
