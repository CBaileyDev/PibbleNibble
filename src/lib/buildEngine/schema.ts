/**
 * lib/buildEngine/schema.ts
 *
 * Zod schemas that mirror the MinecraftBuild TypeScript interfaces.
 * Used to validate AI responses before saving them to Supabase,
 * ensuring a malformed AI output never reaches the database.
 *
 * These schemas are intentionally lenient on optional fields —
 * the AI is allowed to omit them and we fill in sensible defaults.
 */

import { z } from 'zod'

export const MaterialItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  minecraftId: z.string().min(1),
  quantity: z.number().int().positive(),
  gathered: z.number().int().min(0).default(0),
  textureUrl: z.string().url().optional(),
})

export const BuildStepSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0),
  description: z.string().min(1),
  note: z.string().optional(),
  isCompleted: z.boolean().default(false),
})

export const BuildPhaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  order: z.number().int().min(0),
  steps: z.array(BuildStepSchema),
})

export const BuildDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  depth: z.number().int().positive(),
})

export const MinecraftBuildSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1),
  category: z.enum(['house', 'farm', 'storage', 'decoration', 'redstone', 'landmark', 'underground', 'other']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  edition: z.enum(['java', 'bedrock', 'both']),
  dimensions: BuildDimensionsSchema,
  estimatedMinutes: z.number().int().positive(),
  materials: z.array(MaterialItemSchema),
  phases: z.array(BuildPhaseSchema),
  markdownInstructions: z.string(),
  isAiGenerated: z.boolean().default(true),
  tags: z.array(z.string()),
  imageUrl: z.string().url().optional(),
})

export type ValidatedBuildPayload = z.infer<typeof MinecraftBuildSchema>
