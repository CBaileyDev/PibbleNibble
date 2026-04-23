# `generate-build` Edge Function

Runs the Pibble & Nibble Build Designer. Takes a `BuildDesignerInput` payload
from the React client (`src/lib/generateBuilds.ts`), routes it through
Claude Sonnet 4.5, and returns an array of validated `MinecraftBuild`
objects along with any auto-correction warnings.

## Response contract

```json
{
  "builds": [ /* MinecraftBuild[] */ ],
  "warnings": [ "optional human-readable notices" ]
}
```

Matches `GenerateBuildsResponse` in `src/lib/generateBuilds.ts`.

## Fallback behavior

On API-layer failure from Claude (5xx, 429, 401, 403, transport errors,
unknown shapes) the function retries once against **Gemini 2.5 Pro** and
prepends `"Generated with Gemini 2.5 Pro — Claude was temporarily
unavailable."` to `warnings`. The React client surfaces warnings via a
`toast.info` in `BuildResults.tsx`.

Exceptions that do **not** fall back:

- `AbortError` — the client walked away; don't burn the fallback.
- HTTP 4xx other than 401/403/429 — those are bugs on our side (bad
  payload, missing model, etc.), so we surface them unaltered.
- Validation failures — if the model returns JSON that doesn't match
  `MinecraftBuildSchema`, we return a 502 rather than re-rolling against
  the fallback.

## Environment variables

Set via `supabase secrets set` (production) or `--env-file .env`
(`supabase functions serve` locally). Both are **server-side only** —
never prefix with `VITE_`.

| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Primary provider (Claude Sonnet 4.5). |
| `GEMINI_API_KEY` | Fallback (Gemini 2.5 Pro). |

## Deploy

```sh
supabase functions deploy generate-build
supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  GEMINI_API_KEY=...
```

## Local dev

```sh
supabase functions serve generate-build --env-file .env
# in another terminal:
npm run desktop:dev
```

Then open the Build Designer, fill the form, and submit.

## Drift warning: `_shared/buildEngine/`

`_shared/buildEngine/systemPrompt.ts`, `schema.ts`, and `validator.ts` are
hand-copies of the files under `src/lib/buildEngine/`. Deno can't import
`'zod'` without an `npm:` specifier and Supabase Edge Functions bundle
only what lives under `supabase/functions/`, so we mirror them.

When you edit one, **edit the other**. The copies carry a header comment
as a reminder. If this starts costing us, the escape hatches are a pre-
deploy sync script or an import map — both were deferred until drift
actually bites.
