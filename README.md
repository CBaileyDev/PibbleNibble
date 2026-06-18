# Pibble & Nibble 🪨🌸

A Minecraft companion **desktop app** for two — AI-powered build design, project tracking, and shared world notes.

Packaged with [Tauri](https://tauri.app/) (v2) for **Windows 11** and **macOS**. The Supabase backend (Postgres + Auth + Realtime + Edge Functions) is unchanged.

## Stack

| Layer | Choice |
|---|---|
| Desktop shell | Tauri 2 (Rust + WebView2 on Windows, WKWebView on macOS) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Database / Auth | Supabase (Postgres + RLS + Realtime) |
| Edge compute | Supabase Edge Functions (Anthropic proxy) |
| Client state | Zustand |
| Server state | TanStack Query v5 |
| Animations | Framer Motion |
| Validation | Zod (build schema + AI output) |
| Toasts | sonner |
| Tests | Vitest |

## Themes

- **Deepslate** (default) — dark, stone-grey aesthetic
- **Blossom** — soft pink, cherry-blossom aesthetic

Theme is stored per-user in Supabase and applied via `data-theme` on `<html>`.

## Prerequisites

You need the web toolchain **and** the Rust toolchain used by Tauri.

- **Node 20+** and npm
- **Rust (stable)** via [rustup](https://rustup.rs/)
- Platform prerequisites (first time only):
  - **Windows 11**: "Desktop development with C++" workload in Visual Studio Build Tools, plus WebView2 Runtime (preinstalled on Windows 11).
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`). Builds universal binaries for Apple Silicon + Intel.
  - **Linux** (dev / CI only — not a shipping target): the GTK/WebKit stack Tauri builds against. On Debian/Ubuntu:
    ```bash
    sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
      libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libglib2.0-dev
    ```
    Without these, `cargo check` / `tauri dev` fail at the `glib-sys` build script.

See [Tauri prerequisites](https://tauri.app/start/prerequisites/) for the fully detailed per-OS list.

> **Note:** The pure web workflow (`npm run dev`, `npm run build`, `npm test`,
> `npm run lint`) needs only Node — no Rust toolchain required. Reach for the
> Rust prerequisites only when running or packaging the desktop shell.

## Getting Started

```bash
# 1. Install JS deps
npm install

# 2. Copy env file and fill in your credentials
cp .env.example .env
#    Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and the two player
#    logins (VITE_PIBBLE_* / VITE_NIBBLE_*). Create both users first in
#    Supabase Dashboard → Authentication → Users. See .env.example for details.

# 3. Apply the database schema (RLS policies, tables, realtime)
supabase db push        # or: psql -f supabase/migrations/0001_initial_schema.sql

# 4. (Browser-only UI work) start Vite
npm run dev             # http://localhost:1420

# 5. (Desktop) launch the Tauri shell in dev mode (HMR + Rust hot-rebuild)
npm run tauri icon path/to/source-icon.png   # one-time: generate app icons
npm run desktop:dev
```

On first desktop run, Cargo downloads and compiles the Rust dependencies — this takes a few minutes. Subsequent launches are fast.

## Quality gates

```bash
npm run lint         # ESLint (flat config: TS + React Hooks + React Refresh)
npm run type-check   # tsc -b --noEmit, strict mode
npm test             # Vitest unit tests (build validator + Zod schema)
npm run test:watch   # Vitest in watch mode
npm run test:coverage
npm run build        # type-check + production web build
```

All four run in CI on every push and pull request (`.github/workflows/ci.yml`).
The AI build-generation logic (`src/lib/buildEngine`) is the most rules-heavy
part of the app and is covered by unit tests — see `*.test.ts` alongside it.

## Building installers

```bash
# Current host platform — writes installers to src-tauri/target/release/bundle/
npm run desktop:build

# Explicit platform targets
npm run desktop:build:win            # Windows 11: MSI + NSIS (.exe)
npm run desktop:build:mac-universal  # macOS: universal .app + .dmg
```

### Output locations

| Platform | Artifacts | Path |
|---|---|---|
| Windows 11 | `.msi`, `.exe` (NSIS) | `src-tauri/target/release/bundle/msi/`, `.../nsis/` |
| macOS | `.app`, `.dmg` | `src-tauri/target/release/bundle/macos/`, `.../dmg/` |

macOS builds target a **minimum system version of 12.0** and produce a universal binary, so the app runs on all currently supported macOS releases (Sonoma, Sequoia, Tahoe).

### Signing (optional)

Unsigned builds work for local/sideload use. For distribution:

- **macOS**: set `APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PASSWORD` env vars and add `macOS.signingIdentity` / `macOS.providerShortName` to `src-tauri/tauri.conf.json`. Tauri then signs + notarizes automatically.
- **Windows**: set `TAURI_SIGNING_PRIVATE_KEY` (or use a signtool certificate) and add a `windows.certificateThumbprint` entry in the bundle config.

## Project Structure

```
src/                     # React app
├── components/          # UI primitives, layout, feature components
├── pages/               # Route screens (lazy-loaded)
├── features/            # Auth and other vertical slices
├── hooks/               # Supabase-backed data hooks (realtime)
├── lib/                 # supabase client, buildEngine (schema + validator)
├── stores/              # Zustand stores
├── types/               # Shared TypeScript contracts
├── styles/              # Global CSS + keyframes
└── test/                # Test fixtures (Vitest)

src-tauri/               # Desktop shell
├── Cargo.toml           # Rust manifest
├── tauri.conf.json      # App metadata, window, CSP, bundle targets
├── build.rs
├── capabilities/        # Tauri v2 permission grants (shell:allow-open, …)
├── icons/               # Generated from `npm run tauri icon`
└── src/
    ├── main.rs          # Binary entry (suppresses console on Windows release)
    └── lib.rs           # Tauri::Builder — plugins + context

supabase/
├── functions/           # Edge Functions (generate-build: Claude + Gemini fallback)
└── migrations/          # SQL schema + RLS policies

docs/                    # Engineering handoff notes and the health audit
```

## How Supabase works in the desktop app

- Auth is **email/password only** → no OAuth/magic-link redirect handling needed.
- The webview runs under `tauri://localhost` (macOS) or `http://tauri.localhost` (Windows). Supabase accepts these origins for REST + Realtime without extra config.
- `https://*.supabase.co` + `wss://*.supabase.co` are whitelisted in the app's CSP (`src-tauri/tauri.conf.json` → `app.security.csp`). Google Fonts (CSS + woff2) is also allowed.
- The `ANTHROPIC_API_KEY` still lives only in the `generate-build` Edge Function; the desktop bundle never sees it.

## Scripts reference

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server in a browser (useful for UI-only work; port 1420). |
| `npm run build` | Type-check (`tsc -b`) + Vite production build into `dist/`. |
| `npm test` / `npm run test:watch` / `npm run test:coverage` | Vitest unit tests. |
| `npm run desktop:dev` | Run Tauri shell against the Vite dev server with Rust hot-rebuild. |
| `npm run desktop:build` | Full production desktop build for the current host OS. |
| `npm run desktop:build:win` / `:mac-universal` | Explicit platform builds. |
| `npm run tauri <cmd>` | Escape hatch to the Tauri CLI (`icon`, `info`, `signer`, …). |
| `npm run lint` / `npm run type-check` | Frontend quality gates. |
