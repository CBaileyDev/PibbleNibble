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
 *     The function is expected to parse, validate, and auto-correct the
 *     AI output before returning. Builds in the array are safe to render.
 */

import { supabase } from '@/lib/supabase'
import type { BuildDesignerInput, MinecraftBuild } from '@/types/build'

export interface GenerateBuildsResponse {
  builds: MinecraftBuild[]
  warnings?: string[]
}

/** Invoke the `generate-build` Edge Function. Throws on network / API errors. */
export async function generateBuilds(
  input: BuildDesignerInput,
): Promise<GenerateBuildsResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateBuildsResponse>(
    'generate-build',
    { body: input },
  )

  if (error) {
    throw new Error(error.message || 'Build generation failed.')
  }
  if (!data || !Array.isArray(data.builds)) {
    throw new Error('Build generation returned no builds.')
  }
  return data
}
