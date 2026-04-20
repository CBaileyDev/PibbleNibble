/**
 * lib/anthropic.ts
 *
 * Client-side wrapper for calling the Supabase Edge Function that proxies
 * requests to the Anthropic API. The raw ANTHROPIC_API_KEY lives only in the
 * Edge Function environment — it is never sent to the browser.
 *
 * Edge Function: supabase/functions/generate-build/index.ts
 * Deploy with:   supabase functions deploy generate-build
 */

import { supabase } from '@/lib/supabase'
import type { BuildGenerationRequest, BuildGenerationResponse } from '@/types/build'

/**
 * Calls the `generate-build` Supabase Edge Function and returns the parsed
 * AI-generated build. Throws on network or API errors.
 */
export async function generateBuild(
  request: BuildGenerationRequest
): Promise<BuildGenerationResponse> {
  const { data, error } = await supabase.functions.invoke<BuildGenerationResponse>(
    'generate-build',
    { body: request }
  )

  if (error) {
    throw new Error(`Build generation failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('Build generation returned no data.')
  }

  return data
}
