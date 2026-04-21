/**
 * lib/anthropic.ts
 *
 * Client-side bridge to the Supabase Edge Function that proxies build
 * generation to Claude. The Anthropic API key lives only in the Edge
 * Function's environment — it is never sent to the browser.
 *
 * Edge Function: supabase/functions/generate-build/index.ts
 * Contract:
 *   request  → BuildDesignerInput (the designer form payload)
 *   response → { builds: MinecraftBuild[]; warnings?: string[] }
 *
 * Even though the Edge Function is expected to validate + auto-correct the
 * AI output, we re-parse through the canonical Zod schema here so shape
 * drift at the boundary can't crash React render paths.
 */

import { supabase } from '@/lib/supabase'
import { MinecraftBuildSchema } from '@/lib/buildEngine/schema'
import type { BuildDesignerInput, MinecraftBuild } from '@/types/build'

/** Default wall-clock ceiling for a generation request. */
const DEFAULT_TIMEOUT_MS = 90_000

export interface GenerateBuildsResponse {
  builds: MinecraftBuild[]
  warnings?: string[]
}

export interface GenerateBuildsOptions {
  /** Caller-supplied signal (navigation aborts, etc.). */
  signal?: AbortSignal
  /** Override the default 90s wall-clock timeout. */
  timeoutMs?: number
}

/** Invoke the `generate-build` Edge Function. Throws on network / API errors. */
export async function generateBuilds(
  input: BuildDesignerInput,
  options: GenerateBuildsOptions = {},
): Promise<GenerateBuildsResponse> {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options

  const { data, error } = await supabase.functions.invoke<GenerateBuildsResponse>(
    'generate-build',
    { body: input, signal, timeout: timeoutMs },
  )

  if (error) {
    throw new Error(error.message || 'Build generation failed.')
  }
  if (!data || !Array.isArray(data.builds)) {
    throw new Error('Build generation returned no builds.')
  }

  const parsed = MinecraftBuildSchema.array().safeParse(data.builds)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const where = first?.path.join('.') ?? 'builds'
    throw new Error(
      `The AI returned a build that didn't match the expected shape (${where}: ${
        first?.message ?? 'invalid'
      }).`,
    )
  }

  const warnings = Array.isArray(data.warnings) ? data.warnings : undefined
  return { builds: parsed.data as MinecraftBuild[], warnings }
}
