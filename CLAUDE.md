@~/.claude/CLAUDE.md
@AGENTS.md

# wil-2-kas — CLAUDE.md

> Claude reads this file on every message. Keep it lean — every line costs tokens.
> Global rules (architecture, conventions, file map protocol) live in root CLAUDE.md.

## Project Overview

- **Purpose**: TODO — one sentence on what this project does
- **Stack**: TypeScript, Next.js (App Router), Tailwind CSS, Geist font
- **Entry points**: `npm run dev` → next dev, `app/layout.tsx`, `app/page.tsx`
- **Data layer**: Unknown — fill in manually

## Architecture Rules

> Project-specific rules. Global rules in root CLAUDE.md.

1. **App Router only** — use `app/` directory conventions; no `pages/` dir
2. **Server Components by default** — add `'use client'` only where interactivity is required
3. **Fonts via next/font** — use `next/font/google` or `next/font/local`, not `<link>` tags

## Conventions

> Project-specific conventions. Global conventions in root CLAUDE.md.

- Tailwind utility classes for all styling — no CSS modules or styled-components
- Dark mode via Tailwind `dark:` variants (class strategy)

## Directory Map

```
app/
  layout.tsx    # Root layout — Geist fonts, metadata, HTML shell
  page.tsx      # Home page (placeholder, replace with real content)
next.config.ts  # Next.js config (currently empty)
```

## File Map

Global db: `~/.claude/file-map.db` — see root CLAUDE.md for full query reference.

Project ID for wil-2-kas: `4`

```bash
# Search files
sqlite3 ~/.claude/file-map.db \
  "SELECT key, path, description, exports FROM files
   WHERE project_id = 4
   AND (description LIKE '%<keyword>%' OR path LIKE '%<keyword>%')"

# Log a change
sqlite3 ~/.claude/file-map.db \
  "INSERT INTO updates (project_id, file_key, datetime, changes)
   VALUES (4, '<key>', '<YYYY/MM/DD HH:mm>', '<what changed>')"
```
