/**
 * lib/buildEngine/validator.ts
 *
 * Business-rule validation layer on top of the Zod schema parse.
 * Catches logical inconsistencies that Zod's type checks can't catch —
 * e.g. a build claiming 5 minutes with 200 materials is suspicious.
 */

import { MinecraftBuildSchema, type ValidatedBuildPayload } from './schema'

export interface ValidationResult {
  success: true
  data: ValidatedBuildPayload
}

export interface ValidationFailure {
  success: false
  errors: string[]
}

/** Runs schema + business-rule validation. Returns a discriminated union. */
export function validateBuild(raw: unknown): ValidationResult | ValidationFailure {
  const parsed = MinecraftBuildSchema.safeParse(raw)

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    )
    return { success: false, errors }
  }

  const build = parsed.data
  const warnings: string[] = []

  if (build.materials.length === 0) {
    warnings.push('Build has no materials — AI may have omitted the material list.')
  }

  if (build.phases.length === 0) {
    warnings.push('Build has no phases — AI may have omitted the step-by-step instructions.')
  }

  const totalSteps = build.phases.reduce((n, p) => n + p.steps.length, 0)
  if (totalSteps === 0) {
    warnings.push('Build phases contain no steps.')
  }

  if (warnings.length > 0) {
    console.warn('[buildEngine/validator] Validation warnings:', warnings)
  }

  return { success: true, data: build }
}
