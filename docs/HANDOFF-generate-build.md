# Handoff: `generate-build` Edge Function with Claude → Gemini fallback

**To:** Codex (reviewer)
**From:** Claude (implementer)
**Date:** 2026-04-22
**Approved plan:** `/Users/carterbarker/.claude/plans/ultraplan-approved-in-browser-zany-sun.md`

> Note: a separate, unrelated `HANDOFF.md` tracks the production-readiness audit — don't confuse the two.

---

## TL;DR

Before this change, `src/lib/anthropic.ts:44` invoked a Supabase Edge Function named `generate-build` that **did not exist** — every generation attempt in the Build Designer failed at the network layer. This change ships that function with a Claude Sonnet 4.5 primary path and a Gemini 2.5 Pro fallback that kicks in only on API-layer failures (not validation failures). Warnings surface via the existing `BuildResults.tsx` toast.

No client API or behavior change beyond one rename (`src/lib/anthropic.ts` → `src/lib/generateBuilds.ts`) — the export surface is identical.

---

## Files to review

### Edge Function — brand new
| Path | What to look at |
|---|---|
| `supabase/functions/generate-build/index.ts` | Control flow: CORS, Claude-first / Gemini-fallback, fence-stripping + JSON parse, zod shape check, per-build `validateBuild`. Status codes: 502 for bad AI shape, 499 for client abort, 500 for unknown, provider HTTP status otherwise. |
| `supabase/functions/_shared/providers.ts` | `callClaude` hits `https://api.anthropic.com/v1/messages` with `claude-sonnet-4-5`, `max_tokens: 16000`, `anthropic-version: 2023-06-01`. `callGemini` hits `v1beta/models/gemini-2.5-pro:generateContent` with `responseMimeType: 'application/json'`, `maxOutputTokens: 16384`. Both forward `AbortSignal`. Both throw `HttpError` with `.status`. |
| `supabase/functions/_shared/fallback.ts` | `isRetryable(err)` — 8-line decision: AbortError→false, TypeError→true, 5xx/429/401/403→true, other 4xx→false, unknown→true. |
| `supabase/functions/_shared/prompt.ts` | Renders the form payload into a markdown user message. **This is the vocabulary bridge** — form field names don't match the system prompt's "Input Contract" (see [Design decision 1](#1-form-payload-vs-system-prompt-vocabulary)). |
| `supabase/functions/generate-build/README.md` | Env vars, deploy, fallback behavior, drift warning. |

### Deno mirrors of `src/lib/buildEngine/` — copied with minimal edits
| Path | Delta from source |
|---|---|
| `supabase/functions/_shared/buildEngine/systemPrompt.ts` | Drift-warning header + usage-example import path. Prompt body is byte-identical. |
| `supabase/functions/_shared/buildEngine/schema.ts` | Drift-warning header + `import { z } from 'npm:zod@3.23.8'` + three appended type exports (`MaterialItem`, `Phase`, `ProgressionLevel`). |
| `supabase/functions/_shared/buildEngine/validator.ts` | Drift-warning header + import path `'../../types/build'` → `'./schema.ts'`. |

> Verify diffs with:
> ```sh
> diff src/lib/buildEngine/systemPrompt.ts supabase/functions/_shared/buildEngine/systemPrompt.ts
> diff src/lib/buildEngine/schema.ts       supabase/functions/_shared/buildEngine/schema.ts
> diff src/lib/buildEngine/validator.ts    supabase/functions/_shared/buildEngine/validator.ts
> ```
> Anything beyond the header + import + type exports is a transcription error.

### Client changes
| Path | Change |
|---|---|
| `src/lib/anthropic.ts` → `src/lib/generateBuilds.ts` | `git mv`. Header comment updated to reflect model-agnostic bridge. **Export surface unchanged** (`generateBuilds`, `GenerateBuildsResponse`, `GenerateBuildsOptions`). |
| `src/pages/BuildDesigner.tsx:18` | Import path updated — only caller. |
| `.env.example` | Appended `GEMINI_API_KEY` block after the Anthropic one. Both are server-side only. |

---

## Design decisions worth scrutiny

### 1. Form-payload vs system-prompt vocabulary

The form (`BuildDesignerInput`, `src/types/build.ts:534`) sends fields like `buildType`, `difficulty`, `progression`, `biome: string[]`, `specialRequests`. The system prompt (`src/lib/buildEngine/systemPrompt.ts:79-94`) documents a *different* Input Contract: `purpose`, `maxDifficulty`, `progressionLevel`, single `biome`, `additionalNotes`, etc. The second shape comes from an unused `BuildDesignerInputSchema` export (`schema.ts:255`) that nothing in `src/` actually imports.

**Resolution:** `_shared/prompt.ts` renders the form payload into a markdown user message that calls out both names explicitly (`**purpose (buildType):** house`) and maps `size` to a footprint hint. **I did not reshape the payload** into the schema's contract. My reasoning: the system prompt's hard rules (progression gates, block-ID format, JSON-only output, material math) are independent of input field naming, and the `additionalNotes` mechanism already handles free-form hints.

**Questions for review:**
- Is this bridging good enough, or should I actually transform the payload to match the documented contract?
- The `biome: string[]` → "pick one from this list" mapping leans on the LLM to resolve. `MinecraftBuildSchema.biome` is a single enum, so the output needs a single value. Is the natural-language nudge sufficient, or should the server itself pick a biome (e.g., first one)?

### 2. Warnings: fallback vs validator noise

`BuildResults.tsx:43-47` summarizes warnings as:
- 1 warning → show the string verbatim
- \>1 warnings → "N adjustments made by the validator."

I emit the fallback warning as `"Generated with Gemini 2.5 Pro — Claude was temporarily unavailable."` and validator warnings as `"[W001] ..."`. If Gemini responds AND the validator emits any warning, the user sees "2 adjustments made by the validator." — **the fallback notice gets buried.**

**Questions for review:**
- Acceptable (one noisy render per fallback is OK) or should I update `BuildResults.tsx` to split fallback vs validator warnings into separate toasts?
- Should the fallback warning be its own distinct shape (e.g., `{ type: 'fallback' | 'validator', message }`) rather than a flat string?

### 3. No retry on validation failure

Plan (and the user) explicitly asked: "fall back on API failures only (not validation failures)". So if Claude returns JSON that fails `MinecraftBuildSchema.array().safeParse`, I return 502 rather than re-rolling against Gemini. Rationale: if the prompt is bad, both models will fail the same way; rolling over wastes a provider call.

**Questions for review:**
- Is a 502 the right status (gateway got a bad response) or should it be 500 (our fault)? The client surfaces `err.message` in a toast either way.

### 4. Abort handling

`Deno.serve(async (req) => ...)` gives us `req.signal`, forwarded into provider `fetch` calls. `isRetryable` explicitly returns `false` for `AbortError`, so aborts don't burn the fallback. The outer catch also checks `req.signal.aborted` and returns 499 without doing more work.

**Questions for review:**
- `supabase.functions.invoke({ signal })` — does the cancellation actually propagate all the way to `req.signal` on the Deno side? The existing client code already relies on this at `BuildDesigner.tsx:32-34` for the "navigate away" cleanup; I preserved the behavior. Worth confirming if you know the Supabase Functions transport.

### 5. Response unwrap tolerance

`parseLlmJsonArray` strips markdown fences and, if the parsed result is `{ builds: [...] }`, unwraps the array. The system prompt explicitly forbids both, but belt-and-suspenders: Gemini with `responseMimeType: 'application/json'` sometimes emits the wrapper shape despite instructions.

**Questions for review:**
- Worth it, or should I trust the system prompt and let non-conforming output fail loudly?

### 6. Drift risk in `_shared/buildEngine/`

Three files are hand-copied from `src/lib/buildEngine/`. Each copy has a drift-warning header. The plan explicitly deferred a sync script / import map until drift actually bites. That's a deliberate punt — flag if you disagree.

---

## What was NOT verified (needs real keys + Docker)

| What | How to verify |
|---|---|
| Happy path end-to-end | `supabase secrets set ANTHROPIC_API_KEY=… GEMINI_API_KEY=…` then `supabase functions serve generate-build --env-file .env` + `npm run desktop:dev`, submit the form. |
| Gemini fallback | Temporarily set `ANTHROPIC_API_KEY=sk-ant-invalid` — expect builds + info toast *"Generated with Gemini 2.5 Pro — Claude was temporarily unavailable."* Restore the real key. |
| Abort behavior | Submit generation, navigate to Dashboard mid-flight — expect no error toast and no Gemini call in function logs. |
| Validator auto-correction surfacing | Inspect function response payload for `warnings` entries starting with `[W001]` or `[W006]` etc. |
| Deno parse/typecheck | `deno check supabase/functions/generate-build/index.ts` — I could not run this locally (no `deno` binary). The file imports clean to the naked eye, but a real parse is the only authoritative signal. |

---

## What WAS verified

- `npm run type-check` — green (covers all client-side code, doesn't touch `supabase/functions/`).
- `diff` of all three `buildEngine/` mirrors vs their source — only the planned changes, no transcription errors.
- Import-path update is complete: `grep -rn "lib/anthropic" src/` returns nothing.
- File-tree layout matches the plan.

---

## Suggested review checklist

1. **Diff the three mirrors** — one `diff` command each, anything unexpected is a bug.
2. **Read `supabase/functions/generate-build/index.ts`** top-to-bottom. ~130 lines; the control flow is the only file with interesting behavior.
3. **Read `supabase/functions/_shared/prompt.ts`** — is the form-to-prompt bridge reasonable, especially the biome-list and size-hint rendering?
4. **Read `supabase/functions/_shared/fallback.ts`** — are the 8 lines of retry logic what you'd want?
5. **Read `supabase/functions/_shared/providers.ts`** — confirm the Anthropic and Gemini request bodies match the current API shapes. (Model names: `claude-sonnet-4-5`, `gemini-2.5-pro`. Header: `anthropic-version: 2023-06-01`.)
6. **Run the smoke test steps above** if you have the keys + Docker.

---

## Out of scope (deferred per plan)

- Per-user LLM preference toggle in Settings.
- A third provider.
- Client-side retry (server owns retry).
- Unified `_shared/buildEngine/` via symlink / sync script / import map.
- Streaming responses — would require SSE client migration.
