# Production Readiness Audit — Handoff

Branch: `claude/production-readiness-audit-9314b`
Last touched: 2026-04-21

This doc tracks the remaining production-readiness work. Everything listed as **open** below has been verified against the current branch tip — paths, line numbers, and repro details are accurate.

---

## Status at a glance

| Track | Landed | Open |
|---|---|---|
| **Critical (C1–C8)** | C1, C2, C3, C4, C5 | C6, C7, C8 |
| **Important (I1–I11)** | I1, I3, I6, I7, I8, I9, I10 | I2, I4, I5, I11 |
| **Nice to have (N1–N7)** | N2, N4, N6 (mostly), N7 (one instance) | N1, N3, N5 |
| **Post-audit discoveries** | — | D1, D2, D3, D4, D5 |

`npm run type-check` passes cleanly (0 errors across all project references). The script itself was broken until last session — see D5.

---

## Completed (reference)

Anchor commits:

- `3e3ee20` — C1, C2, C3, C4, C5, I6
- `c7fcf63` — I7, I8, I9, I10, N11, N12, N13

See those commit messages for the specifics. Summary:

- **C1/C2** — Deleted `src/features/ai-designer/{buildGenerator,promptBuilder}.ts` (broken types + wrong validator API, unreferenced).
- **C3** — `src/pages/BuildDesigner.tsx` now calls `generateBuilds()` from `src/lib/anthropic.ts` with try/catch/finally + toast on failure. The 15s setTimeout stub is gone.
- **C4** — Deleted `src/lib/buildEngine/generator.ts` (used `process.env.ANTHROPIC_API_KEY` in browser bundle).
- **C5** — `useAuth` split into `useAuthSubscription` (mount-once in new `AuthGate` root element) and `useAuth` (consumer actions). Added `authReady` to the user store; `AuthGate` shows a splash while the initial session probe is in flight.
- **I6** — Added `src/hooks/useProjects.ts` (user-scoped + realtime-filtered, exposes `byBuildId` map). `SavedBuilds` joins builds ⟵⟶ projects via the map instead of synthesising fake projects from a non-existent `build.status` field.
- **I7** — Reshaped `StepCard` / `PhaseTabBar` / `BuildProgressBar` to canonical `MinecraftBuild` / `Phase` / `BuildStep`. Completion is now a `Set<string>` prop. `BuildDetail` dropped every `as never` cast.
- **I8** — Added `supabase/migrations/0001_initial_schema.sql` with explicit RLS policies, realtime publication wiring, and `updated_at` triggers for `profiles`, `builds`, `projects`, `world_notes`.
- **I9** — Rewrote `useBuilds` with explicit `BuildRow` whitelist; `saveBuild` pulls `user_id` from the store.
- **I10** — Settings `handleClearProgress` → `handleClearWorldNotes`; toast copy + JSX entity fixed.
- **N11/N12/N13** — Memoized `Dashboard.activeProject` and `BuildProgressBar`; specific `aria-label` on delete buttons and result cards; `aria-live` on the generation count; `role="tablist"` / `role="progressbar"`; deleted `mockBuilds.ts`, `buildDisplay.ts`, `types/display.ts`; fixed `uiStore.openModal` typing; fixed `npm run type-check` script (see D5).

---

## CRITICAL — open

### C6. User-scoped queries + realtime filters missing
**Risk:** If the RLS policies from migration `0001` are dropped, disabled, or misconfigured, every user sees every other user's builds. Realtime subscriptions also fire refetches on unrelated users' events, wasting bandwidth.

**Where:**
- `src/hooks/useBuilds.ts:133–136` — `.from('builds').select('*')` has no `.eq('user_id', userId)`.
- `src/hooks/useBuilds.ts:233–237` — same for `useBuild(id)`.
- `src/hooks/useBuilds.ts:191–196` — realtime channel listens to `table: 'builds'` with no `filter`.
- `src/hooks/useBuilds.ts:253–258` — single-build channel already filters by `id`, no user scope needed (RLS suffices for single-row lookup).
- `src/hooks/useWorldNotes.ts:104–108` — realtime channel has no filter (intentional: `world_notes` is shared-read per migration `0001`; leave as-is **unless** the product changes to per-user visibility).
- `src/hooks/useProject.ts:170–186` — filter is `build_id=eq.${buildId}` but should also include `user_id=eq.${userId}` (defense in depth).

**Fix:** Pull `userId` from `useUserStore` (already imported in several hooks). Early-return when `userId` is `null`. Add `.eq('user_id', userId)` to every select. Use `filter: \`user_id=eq.${userId}\`` on realtime channels. Mirror the pattern already established in `src/hooks/useProjects.ts:54–79`.

### C7. Dead "tolerant" readers in `BuildCard.tsx` still paper over a canonical boundary
**Risk:** Cosmetic — the DB boundary is now canonical (I9), so `buildName` / `buildPalette` / `buildProgression` in `BuildCard.tsx:47–69` always take the first branch. The `as unknown as Record<string, unknown>` casts defeat strict typing for no value.

**Where:** `src/components/build/BuildCard.tsx:43–69`.

**Fix:** Delete the three helpers and read `build.name`, `build.blockPalette.colorHexes`, `build.progressionLevel` directly (the exact pattern used now in `Dashboard.tsx` and `SavedBuilds.tsx`).

### C8. No Zod validation at the AI-output boundary
**Risk:** `MinecraftBuildSchema` exists in `src/lib/buildEngine/schema.ts:218` but is not imported anywhere in the client tree. The Edge Function (`supabase/functions/generate-build/`) should parse its response through this schema before returning to the client — if it doesn't, a malformed LLM response hits React render paths and can crash.

**Where:** Outside this repo (`supabase/functions/generate-build/index.ts` — not checked in). The client-side `src/lib/anthropic.ts:18–34` trusts `data.builds` and only checks `Array.isArray`.

**Fix:** Either (a) add a defensive `MinecraftBuildSchema.array().safeParse(data.builds)` inside `generateBuilds()` in `src/lib/anthropic.ts` with a clear error surface; or (b) build the Edge Function so the client truly can trust it and document that contract. Option (a) is cheaper and layered.

---

## IMPORTANT — open

### I2. Ref mutation during render
**Where:**
- `src/hooks/useBuilds.ts:150` — `fetchRef.current = fetchSavedBuilds`
- `src/hooks/useWorldNotes.ts:56` — `fetchRef.current = fetchNotes`

**Problem:** React may call render functions twice under StrictMode / concurrent rendering; mutating a ref during render is unsafe. The assignment currently works because `useCallback` stabilizes the fetcher, but any future non-memoized change will cause stale-closure bugs.

**Fix:** Each fetcher is already stabilized by `useCallback`; the `fetchRef` is unnecessary. Call `fetchSavedBuilds()` / `fetchNotes()` directly inside the realtime channel handler (the effect deps already include the fetcher). Delete the ref.

### I4. Validator warnings never reach the user
**Problem:** The Edge Function contract (`src/lib/anthropic.ts:20–22`) includes an optional `warnings?: string[]`, but no UI surface consumes it. Auto-correction (`validator.ts:157–161`, `W001`, `W006`) is silent to the user.

**Where:**
- `src/pages/BuildDesigner.tsx:32–35` — destructures `{ builds }` only, drops `warnings`.
- `src/pages/BuildResults.tsx:22–31` — location state has no `warnings?` field.

**Fix:** Add `warnings?: string[]` to `BuildResultsLocationState`, pass it through from `BuildDesigner`, and render a non-blocking toast or banner on `BuildResults` when present. One-line toast for now, dedicated UI later.

### I5. Progress page reads fields that don't exist on `MinecraftBuild`
**Problem:** `src/pages/Progress.tsx:685–724` reads `r.status`, `r.completedAt`, `r.sessionCount`, and does `Array.isArray(r.blockPalette)` — none of which are ever truthy on the canonical shape. Consequence: every "completed" filter is empty, every `accentColor` defaults to `#6d83f2`, and the page silently falls through to `FALLBACK_COMPLETED_BUILDS` in almost all real scenarios.

**Fix:** This is the same root cause as I6 — "status" belongs on `BuildProject`, not `MinecraftBuild`. Rewrite Progress to:
1. Use `useProjects()` (already exists) and join with `useBuilds()` on `buildId`.
2. Take `completedAt` from `project.updatedAt` where `project.status ∈ {'done','completed'}`.
3. Read palette from `build.blockPalette.colorHexes[0]`.
4. Derive `sessionCount` from something real (probably drop the field or count events from an `activity` table when it exists).

### I11. No timeout / abort on the Edge Function call
**Where:** `src/lib/anthropic.ts:19–35`.

**Fix:** Accept an `AbortSignal` parameter; pass it via `supabase.functions.invoke(..., { signal })`. Thread it from `BuildDesigner.handleSubmit` so unmounting or switching pages cancels the request. Add a wall-clock timeout (e.g., 90s) via `AbortSignal.timeout(90_000)`.

---

## NICE TO HAVE — open

### N1. TanStack Query is wired but unused
**Where:** `src/providers/QueryProvider.tsx:12` imports `QueryClientProvider` and is mounted in `main.tsx`; zero hooks in `src/hooks/*` use `useQuery` / `useMutation`.

**Fix:** Gradually migrate `useBuilds`, `useProjects`, `useWorldNotes`, `useUserProfile`, `useMaterialChecklist` to `useQuery` with keys like `['builds', userId]`. You get caching, dedupe, background refetch, and the ref-mutation problem (I2) evaporates. Realtime can invalidate via `queryClient.invalidateQueries`.

### N3. Pages load the whole library for small slices
**Where:** `src/pages/Dashboard.tsx`, `src/pages/Progress.tsx`, `src/pages/BuildResults.tsx` all call `useBuilds()` which fetches the entire builds table + subscribes to realtime.

**Fix:** Split into purpose-built hooks — `useRecentBuilds(3)`, `useCompletedBuilds()`, `useSaveBuild()` (mutation only). Trivially falls out of the N1 migration.

### N5. Modal focus management not verified
**Where:** `src/components/ui/Modal.tsx` (not inspected in this audit). Consumers: `WorldNotes.tsx`, `Settings.tsx`.

**Fix:** Confirm the component traps focus, closes on `Escape`, and restores focus to the triggering element on close. If it doesn't, wrap it in `@radix-ui/react-dialog` — already compatible with the existing styling.

---

## POST-AUDIT DISCOVERIES (found during handoff sweep)

These were not in the original audit; they surfaced while double-checking the repo.

### D1. **`AppToaster` is never mounted — every toast call is a silent no-op.** **(Critical)**
**Where:** `src/components/ui/Toast.tsx:15` exports `AppToaster`, but nothing in `src/main.tsx`, `src/App.tsx`, `src/components/layout/AppShell.tsx`, or `AuthGate.tsx` renders it. The file's own doc comment says "Place `<AppToaster />` once in AppShell" — nobody did.

**User-visible impact:** 15 call sites currently believe they're showing toasts. None of them are:
- `BuildDesigner.tsx:37` — generation failures
- `LoginPage.tsx:37` — login errors
- `BuildResults.tsx:45` — save failures
- `Settings.tsx:142, 144, 163, 171, 178, 180, 209` — profile/notes/prefs feedback
- `WorldNotes.tsx:58, 62` — add-note feedback
- `MaterialChecklist.tsx:60, 67, 69` — checklist feedback

**Fix:** Add `<AppToaster />` as a sibling of `<Outlet />` inside `AppShell` (so it sits inside the authenticated tree) and/or inside `AuthGate` (so `LoginPage` can also use it). One line:

```tsx
// src/components/layout/AppShell.tsx
import { AppToaster } from '@/components/ui/Toast'
// ...inside <main>, after <Outlet />:
<AppToaster />
```

### D2. Dashboard `completedCount` always reads 0 **(Important)**
**Where:** `src/pages/Dashboard.tsx:96–102`.

```ts
const completedCount = useMemo(
  () =>
    builds.filter(
      (b) =>
        (b as unknown as { status?: string }).status === 'done' ||
        (b as unknown as { status?: string }).status === 'completed',
    ).length,
  [builds],
)
```

Same root cause as I5: `MinecraftBuild` has no `status` — status lives on `BuildProject`. Every stat card that reads `completedCount` shows 0. The subtitle copy `"You and Pibble have ${...} active builds"` and the Active/Completed tiles are misleading.

**Fix:** Join with `useProjects()`, filter projects by status, count distinct `buildId`s. Or compute it once in a shared `useBuildStats()` hook.

### D3. `SavedBuilds.handleSave` is a local-only toggle **(Important)**
**Where:** `src/pages/SavedBuilds.tsx:146–148`.

```ts
function handleSave(buildId: string) {
  setSavedFlags((prev) => ({ ...prev, [buildId]: !prev[buildId] }))
}
```

"Save" on a build card in the library just flips a local boolean that contributes to the `key` prop (forcing a remount). No DB write. Since builds shown in `SavedBuilds` are already persisted (that's the whole point), the button is either redundant or should mean something like "favorite".

**Fix:** Either (a) remove the button entirely — the builds are already saved — or (b) repurpose it as a favorite toggle backed by the `is_favorite` column that already exists in the `builds` migration. Remove `savedFlags` state either way.

### D4. signIn → navigate race **(Minor, pre-existing)**
**Where:** `src/features/auth/useAuth.ts:82–86`.

```ts
async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  navigate('/')
}
```

`signInWithPassword` resolves when the session is saved, fires `onAuthStateChange`, which `AuthGate` catches and calls `syncProfile` — **asynchronously**. `navigate('/')` runs before `syncProfile` populates `user` in the store, so `RequireAuth` may briefly see `user === null` and bounce back to `/login`. The user usually never notices because the second re-render fires milliseconds later, but it's observable under a slow network.

**Fix:** Either (a) have `signIn` await the profile fetch inline before navigating; (b) remove the `navigate('/')` call and let `LoginPage` observe `user` via `useEffect(() => { if (user) navigate('/') }, [user])`; or (c) make `RequireAuth` also wait on an `authResolving` state, not just `authReady`. Option (b) is the cleanest.

### D5. **`npm run type-check` was silently checking zero files** (already fixed, document for posterity)
**Where:** `package.json` `type-check` script (fixed in `c7fcf63` to `tsc -b --noEmit`). The root `tsconfig.json` has `"files": []` and two `references`, so bare `tsc --noEmit` returned exit 0 without touching any files. 30+ pre-existing type errors were hidden. **Any future changes to `tsconfig.json` must preserve `-b` in the script.**

---

## Verification checklist before merging

- [ ] `npm run type-check` exits 0 *with* `-b` (tests `tsconfig.app.json` + `tsconfig.node.json`).
- [ ] `npm run lint` exits 0. *(Not run as part of this audit — worth checking.)*
- [ ] Manual smoke:
  - [ ] Hard refresh on `/` while logged in → splash then dashboard, no bounce to `/login`.
  - [ ] Sign out from a second tab → first tab navigates to `/login` within a few seconds.
  - [ ] Build Designer → submit with stub Edge Function → error toast appears *(requires D1 first)*.
  - [ ] Saved Builds tab counts match the actual In Progress / Completed projects.
  - [ ] Delete a world note → only that note vanishes on both Pibble's and Nibble's clients.
- [ ] Deploy migration `supabase/migrations/0001_initial_schema.sql` (or confirm an equivalent is already live). **Do not enable the app in production without RLS applied.**
- [ ] Deploy the Edge Function at `supabase/functions/generate-build/` (not in this repo). It should:
  1. Accept `BuildDesignerInput` as the request body.
  2. Call Anthropic server-side using `ANTHROPIC_API_KEY`.
  3. Parse the response, run `validateBuild` (+ ideally `MinecraftBuildSchema.safeParse`), handle one retry, and return `{ builds: MinecraftBuild[]; warnings?: string[] }`.

---

## Suggested next-session ordering

1. **D1** first — almost any subsequent QA depends on toasts actually firing.
2. **C6** — user-scoped queries / realtime filters. Defense in depth even with RLS.
3. **D2 + D3 + I5** together — all three share the "status lives on project, not build" root cause. One refactor fixes them.
4. **C8** — layer Zod at the client boundary so Edge Function shape drift can't crash the UI.
5. **I2** — drop `fetchRef`, which gets cleaner as part of N1.
6. **N1** — TanStack Query migration. Subsumes I2/N3/C7. Biggest leverage, largest diff.
7. **I4 + I11** — surface warnings, add abort. Small, high-value.
8. **D4** — signIn race.
9. **N5** — modal a11y spot-check.
10. **C7** — delete the `BuildCard` tolerant helpers (cosmetic, but small).

---

## File inventory touched by the audit

```
A  HANDOFF.md                                    (this file)
A  supabase/migrations/0001_initial_schema.sql
A  src/components/layout/AuthGate.tsx
A  src/hooks/useProjects.ts
M  package.json
M  src/App.tsx
M  src/components/build/BuildResultCard.tsx
M  src/components/dashboard/ActiveProjectCard.tsx
M  src/components/dashboard/RecentBuildCard.tsx
M  src/components/instructions/BuildProgressBar.tsx
M  src/components/instructions/PhaseTabBar.tsx
M  src/components/instructions/StepCard.tsx
M  src/features/auth/useAuth.ts
M  src/hooks/useBuilds.ts
M  src/lib/anthropic.ts
M  src/pages/BuildDesigner.tsx
M  src/pages/BuildDetail.tsx
M  src/pages/BuildResults.tsx
M  src/pages/Dashboard.tsx
M  src/pages/SavedBuilds.tsx
M  src/pages/Settings.tsx
M  src/pages/WorldNotes.tsx
M  src/stores/uiStore.ts
M  src/stores/userStore.ts
D  src/features/ai-designer/buildGenerator.ts
D  src/features/ai-designer/promptBuilder.ts
D  src/lib/buildDisplay.ts
D  src/lib/buildEngine/generator.ts
D  src/lib/mockBuilds.ts
D  src/types/display.ts
```
