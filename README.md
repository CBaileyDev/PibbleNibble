# Pibble & Nibble 🪨🌸

A Minecraft companion desktop app for two — AI-powered build design, project tracking, and shared world notes.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Database / Auth | Supabase (Postgres + RLS + Realtime) |
| Hosting | Vercel |
| Client state | Zustand |
| Server state | TanStack Query v5 |
| Animations | Framer Motion |
| Forms | react-hook-form + zod |
| Drag & drop | @dnd-kit |
| Toasts | sonner |

## Themes

- **Deepslate** (default) — dark, stone-grey aesthetic
- **Blossom** — soft pink, cherry-blossom aesthetic

Theme is stored per-user in Supabase and applied via `data-theme` on `<html>`.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your Supabase credentials
cp .env.example .env

# 3. Start dev server
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable primitives (Button, Card, Badge …)
│   ├── layout/       # AppShell, Sidebar, Header, PageLayout
│   ├── build/        # BuildCard, BuildDesignerForm, BuildResultCard
│   ├── instructions/ # StepCard, PhaseTabBar, MaterialChecklist
│   └── dashboard/    # StatCard, ActiveProjectCard, QuickActions
├── pages/            # Route-level page components
├── features/
│   ├── auth/         # Login page + useAuth hook
│   ├── ai-designer/  # Build generation logic + prompts
│   └── library/      # Saved builds grid + filter logic
├── hooks/            # Shared TanStack Query hooks
├── lib/
│   ├── supabase.ts   # Supabase client
│   ├── anthropic.ts  # Edge-function client wrapper
│   └── buildEngine/  # Schema, validator, system prompt
├── stores/           # Zustand stores (ui, user)
├── types/            # Shared TypeScript interfaces
└── styles/           # globals.css (themes) + animations.css
```

## Supabase Edge Function

Anthropic API calls are made server-side inside a Supabase Edge Function (`supabase/functions/generate-build/`) to keep the `ANTHROPIC_API_KEY` out of the browser bundle. The client calls this function via the Supabase functions client.

## Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or connect the GitHub repo in the Vercel dashboard for automatic deploys.
```
