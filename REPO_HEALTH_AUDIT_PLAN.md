# Repository Health Audit & Remediation Plan

Date: 2026-04-21 (UTC)
Scope: Entire repository (`src`, `src-tauri`, build config, dependency metadata)

## 1) How this audit was performed

### Automated checks run
1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. `npm ci`
5. `npm install`
6. `cargo check` (from `src-tauri/`)
7. targeted static scan for leak-prone patterns:
   - `setInterval`, `setTimeout`, `useEffect`, `addEventListener`, `removeEventListener`,
     `AbortController`, realtime subscriptions, URL object URLs

### Important environment constraints observed
- NPM package fetches were blocked (`403 Forbidden` for `@tauri-apps/api`), preventing a full dependency restore.
- Rust desktop build cannot complete in this environment because system package `glib-2.0` is unavailable to `pkg-config`.

Because of those two constraints, this report combines:
- hard failures from the checks above, and
- source-level risk review for memory leaks / stale updates / lifecycle correctness.

---

## 2) Findings (ranked by severity)

## CRITICAL-1: JS dependency graph is non-reproducible

### Evidence
- `npm ci` fails because `package.json` and `package-lock.json` are out of sync (missing multiple `@tauri-apps/*` entries).
- `npm install` cannot fetch required packages in this environment (`403`), so dependency state cannot be converged here.

### Why this matters
- CI and teammate setups are non-deterministic.
- Type-check/lint/build results become noisy and potentially misleading.
- Security review and SBOM generation become unreliable if lockfile is stale.

### Fix plan
1. On a machine with npm registry access, run:
   - `npm install`
   - `npm ls --depth=0`
2. Commit the refreshed `package-lock.json`.
3. Add CI gate:
   - run `npm ci`
   - fail if lock mismatch occurs.
4. Optional hardening:
   - pin `engines.node` and `engines.npm` in `package.json`.
   - enforce with `.npmrc` (`engine-strict=true`) if org allows.

---

## CRITICAL-2: TypeScript pipeline currently not trustworthy in this environment

### Evidence
- `npm run type-check` reports module resolution failures (`react`, `react-router-dom`, `vite`, etc.), plus many cascading JSX/implicit-any errors.
- Most downstream errors are secondary to missing installed dependencies/types.

### Why this matters
- Real type defects are hidden under infrastructure failures.
- Teams cannot trust red/green TS signals.

### Fix plan
1. Resolve dependency lock mismatch first (CRITICAL-1).
2. Re-run `npm run type-check` to obtain the true post-install error set.
3. Triage in this order:
   - (a) config-level errors (`tsconfig*`, path aliases)
   - (b) shared component prop typing
   - (c) hook/store inference gaps (`implicit any` hotspots)
4. Require `npm run type-check` in CI before merge.

---

## HIGH-1: Lint command is broken due to ESLint v9 config migration gap

### Evidence
- `npm run lint` fails immediately: no `eslint.config.(js|mjs|cjs)` found.
- Script is configured for ESLint 9, which no longer uses `.eslintrc*` by default.

### Why this matters
- No static enforcement for hook deps, unsafe patterns, complexity, or dead code.
- Memory leak and stale closure defects are harder to prevent.

### Fix plan
1. Add root `eslint.config.js` (flat config) compatible with ESLint 9.
2. Include at minimum:
   - `@typescript-eslint` parser/plugin
   - `eslint-plugin-react-hooks`
   - `eslint-plugin-react-refresh`
3. Enable rules:
   - `react-hooks/exhaustive-deps`
   - `@typescript-eslint/no-floating-promises`
   - `@typescript-eslint/no-misused-promises`
   - `no-console` (warn or error per team policy)
4. Add `npm run lint` as required CI check.

---

## HIGH-2: Desktop Rust build is blocked by missing system dependency

### Evidence
- `cargo check` fails at `glib-sys` build script.
- `pkg-config` cannot find `glib-2.0.pc`.

### Why this matters
- Tauri desktop app cannot be validated in CI or this container.
- Native regressions can merge undetected.

### Fix plan
1. Document Linux build prerequisites in `README.md`:
   - `libglib2.0-dev` (or distro equivalent)
   - other Tauri GTK/WebKit dependencies as needed.
2. In CI, use an image with those packages preinstalled.
3. Add `cargo check` job scoped to `src-tauri/`.

---

## MEDIUM-1: Potential stale-state updates after unmount in async hooks

### Evidence
- Several hooks (`useWorldNotes`, `useProjects`, `useProject`, `useMaterialChecklist`, `useUserProfile`, `useBuilds`) perform async fetches and set state, but do not consistently guard updates with an `isMounted` flag or request token.
- Realtime callbacks may trigger fetches near unmount boundaries.

### Risk
- React warning/noise in strict/dev modes.
- Rare UI flicker or stale data overwrites under rapid route changes.

### Fix plan (repeatable pattern)
1. Introduce a common helper pattern per hook:
   - `let active = true` inside `useEffect`.
   - before every `setState`, check `if (!active) return`.
   - cleanup sets `active = false`.
2. Prefer abortable fetch where supported.
3. For Supabase callbacks, ignore events when inactive.
4. Add tests simulating unmount during pending fetch.

---

## MEDIUM-2: Realtime refetch amplification risk (performance + memory pressure)

### Evidence
- Multiple hooks subscribe to `event: '*'` and call full refetch on each event.
- Hooks can coexist on one screen, causing bursts of overlapping network + render work.

### Risk
- Excessive memory churn (array allocations, reconciliation work).
- Potential UI lag on noisy tables.

### Fix plan
1. Replace `event: '*'` with narrowed events where possible.
2. Debounce/coalesce refetch triggers (e.g., 100–250ms).
3. Prefer event-payload patching for simple INSERT/UPDATE/DELETE when safe.
4. Add lightweight instrumentation around refetch counts per minute.

---

## LOW-1: NPM warning indicates proxy config drift

### Evidence
- NPM warns about unknown config `http-proxy`.

### Risk
- Future npm versions may hard fail on this setting.

### Fix plan
1. Inspect user/project `.npmrc` entries.
2. Remove or migrate deprecated key.

---

## 3) Memory leak specific review

### Confirmed-good patterns already present
- `useAuthSubscription`: unsubscribes auth listener on cleanup.
- Supabase realtime hooks remove channels on cleanup (`supabase.removeChannel(channel)`).
- `Modal` removes `keydown` listener on cleanup.
- `usePhaseCycler` clears timeouts.
- `BuildDesigner` aborts in-flight request on unmount.
- `Settings` revokes object URL after download trigger.

### Remaining leak/stability hardening actions
1. Standardize mounted guards for every async state writer.
2. Add shared utility for safe async effects to reduce copy/paste mistakes.
3. Add React StrictMode test pass focused on mount/unmount churn.
4. Add perf trace script for realtime-heavy pages.

---

## 4) Execution roadmap (for another AI/engineer to apply directly)

## Phase A — Make the toolchain deterministic (Day 0)
1. Fix lockfile/package sync on a network-enabled machine.
2. Commit lockfile update.
3. Add CI steps:
   - `npm ci`
   - `npm run lint`
   - `npm run type-check`
4. Verify local green for JS install + type/lint pipeline.

**Exit criteria:** install and lint/type-check run without infrastructure/config failures.

## Phase B — Restore lint authority (Day 0–1)
1. Add `eslint.config.js` flat config.
2. Enable hooks + TS promise safety rules.
3. Fix resulting lint issues in small batches.

**Exit criteria:** `npm run lint` green.

## Phase C — Resolve true TS defects (Day 1–2)
1. Re-run type-check post-install.
2. Categorize by root cause:
   - typings/import resolution
   - prop contract mismatches
   - implicit any callbacks
3. Fix from shared primitives outward (types/hooks/components/pages).

**Exit criteria:** `npm run type-check` green with strict mode retained.

## Phase D — Lifecycle and leak hardening (Day 2–3)
1. Add mounted-guard pattern to async hooks.
2. Debounce/coalesce realtime-triggered refetches.
3. Add regression tests for unmount during pending async operations.

**Exit criteria:** no stale-update warnings; measurable reduction in redundant refetches.

## Phase E — Desktop build reliability (parallel track)
1. Add Linux dependency prerequisites to docs and CI image.
2. Run `cargo check` in CI job after system deps provisioned.

**Exit criteria:** stable green `cargo check` on CI.

---

## 5) Suggested issue breakdown (copyable)

1. `build: sync package-lock with package.json; enforce npm ci in CI`
2. `build: migrate ESLint config to flat eslint.config.js`
3. `types: resolve strict TS errors after dependency restoration`
4. `hooks: add mounted guards to async state updates`
5. `realtime: reduce wildcard subscription refetch amplification`
6. `tauri: document/install glib and required desktop build deps`
7. `ops: clean deprecated npm http-proxy config`

---

## 6) Fast validation checklist after fixes

1. `npm ci`
2. `npm run lint`
3. `npm run type-check`
4. `npm run build`
5. `cargo check --manifest-path src-tauri/Cargo.toml`
6. Manual smoke:
   - login/logout cycle
   - build generation cancel + retry
   - realtime updates in projects/world notes/checklist
   - settings export flow

All six should pass before release tagging.
