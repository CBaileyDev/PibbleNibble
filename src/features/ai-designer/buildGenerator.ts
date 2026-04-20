/**
 * features/ai-designer/buildGenerator.ts
 *
 * Orchestrates the full AI build generation flow:
 * 1. Build the user prompt
 * 2. Call the Supabase Edge Function (which runs Claude server-side)
 * 3. Validate the response with the Zod schema
 * 4. Return a validated BuildGenerationResponse
 *
 * This module is the single entry point for AI generation — components
 * should import generateBuild from here, not from lib/anthropic directly.
 */

import { generateBuild as callEdgeFunction } from '@/lib/anthropic'
import { validateBuild } from '@/lib/buildEngine/validator'
import { buildUserPrompt } from './promptBuilder'
import type { BuildGenerationRequest, BuildGenerationResponse } from '@/types/build'

/**
 * Full generation pipeline. Throws descriptive errors on failure so the
 * calling component (BuildDesignerForm) can surface them as toasts.
 */
export async function generateAndValidateBuild(
  request: BuildGenerationRequest
): Promise<BuildGenerationResponse> {
  const userPrompt = buildUserPrompt(request)

  const response = await callEdgeFunction({ ...request, prompt: userPrompt })

  const validation = validateBuild(response.build)
  if (!validation.success) {
    throw new Error(
      `AI returned an invalid build structure:\n${validation.errors.join('\n')}`
    )
  }

  return { ...response, build: validation.data }
}
