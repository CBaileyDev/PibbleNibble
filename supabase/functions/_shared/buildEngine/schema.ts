// ⚠ Mirror of src/lib/buildEngine/schema.ts — keep in sync manually.
//   Why two copies? Deno can't import 'zod' without an npm: specifier, and
//   Supabase Edge Functions only bundle files inside supabase/functions/.
// ============================================================================
// Zod validation schemas for the comprehensive Minecraft build schema.
// These schemas are derived from the TypeScript interfaces in src/types/build.ts
// and ensure data integrity when AI systems generate builds.
//
// Design philosophy:
//   - Lenient on optional fields (AI can omit and defaults apply)
//   - Strict on required fields (no malformed data reaches the database)
//   - Self-documenting via comments matching the TypeScript definitions
// ============================================================================

import { z } from 'npm:zod@3.23.8';

// ---------------------------------------------------------------------------
//  VALIDATION HELPERS
// ---------------------------------------------------------------------------

const BEDROCK_BLOCK_ID_PATTERN = /^minecraft:[a-z_]+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
//  TYPE SCHEMAS
// ---------------------------------------------------------------------------

export const ThemeSchema = z.enum([
  'fantasy',
  'medieval',
  'modern',
  'cozy',
  'nordic',
  'desert',
  'coastal',
  'forest',
  'magical'
]);

export const PurposeSchema = z.enum([
  'house',
  'cottage',
  'castle',
  'tower',
  'farm',
  'storage',
  'bridge',
  'shop',
  'decoration'
]);

export const BiomeSchema = z.enum([
  'plains',
  'forest',
  'snowy',
  'desert',
  'jungle',
  'mushroom',
  'mesa',
  'swamp',
  'ocean'
]);

export const DifficultySchema = z.enum([
  'beginner',
  'easy',
  'medium',
  'hard',
  'expert'
]);

export const ProgressionLevelSchema = z.enum([
  'early',
  'mid',
  'late',
  'endgame'
]);

export const MaterialCategorySchema = z.enum([
  'structural',
  'decorative',
  'functional',
  'rare'
]);

export const ObtainMethodSchema = z.enum([
  'mine',
  'craft',
  'trade',
  'find',
  'smelt'
]);

export const FootprintShapeSchema = z.enum([
  'rectangle',
  'l-shape',
  'u-shape',
  'irregular'
]);

// ---------------------------------------------------------------------------
//  MATERIAL SYSTEM SCHEMAS
// ---------------------------------------------------------------------------

export const MaterialItemSchema = z.object({
  blockId: z
    .string()
    .regex(BEDROCK_BLOCK_ID_PATTERN, 'Invalid Bedrock block ID format'),
  blockName: z.string().min(1),
  quantity: z.number().int().positive(),
  category: MaterialCategorySchema,
  obtainMethod: ObtainMethodSchema,
  progressionRequired: ProgressionLevelSchema,
  isOptional: z.boolean(),
  substituteBlockId: z
    .string()
    .regex(BEDROCK_BLOCK_ID_PATTERN, 'Invalid Bedrock block ID format')
    .optional(),
});

// ---------------------------------------------------------------------------
//  BLOCK PALETTE SCHEMA
// ---------------------------------------------------------------------------

export const BlockPaletteSchema = z.object({
  primaryBlocks: z
    .array(z.string().regex(BEDROCK_BLOCK_ID_PATTERN))
    .min(3)
    .max(5),
  accentBlocks: z
    .array(z.string().regex(BEDROCK_BLOCK_ID_PATTERN))
    .min(2)
    .max(3),
  functionalBlocks: z
    .array(z.string().regex(BEDROCK_BLOCK_ID_PATTERN)),
  colorHexes: z
    .array(z.string().regex(HEX_COLOR_PATTERN, 'Invalid hex color format')),
});

// ---------------------------------------------------------------------------
//  CONSTRUCTION STEPS & PHASES SCHEMAS
// ---------------------------------------------------------------------------

export const StepBlockUsageSchema = z.object({
  blockId: z
    .string()
    .regex(BEDROCK_BLOCK_ID_PATTERN),
  blockName: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CumulativeMaterialSchema = z.object({
  blockId: z
    .string()
    .regex(BEDROCK_BLOCK_ID_PATTERN),
  total: z.number().int().nonnegative(),
});

export const BuildStepSchema = z.object({
  stepId: z.string().regex(/^phase-\d+_step-\d+$/),
  stepNumber: z.number().int().positive(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  blocksUsed: z.array(StepBlockUsageSchema),
  approximateArea: z.string().min(1),
  tip: z.string().optional(),
  warning: z.string().optional(),
  isCheckpoint: z.boolean(),
  cumulativeMaterialsUsed: z.array(CumulativeMaterialSchema),
});

export const PhaseSchema = z.object({
  phaseId: z.number().int().positive(),
  phaseName: z.string().min(1),
  phaseDescription: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  steps: z.array(BuildStepSchema).min(1),
});

// ---------------------------------------------------------------------------
//  VISUAL PREVIEW SCHEMA
// ---------------------------------------------------------------------------

export const VisualPreviewSchema = z.object({
  previewDescription: z.string().min(1),
  highlightFeature: z.string().min(1),
  colorPalette: z.array(z.string().regex(HEX_COLOR_PATTERN)),
});

// ---------------------------------------------------------------------------
//  DIMENSIONS SCHEMA
// ---------------------------------------------------------------------------

export const DimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  depth: z.number().int().positive(),
  totalBlocks: z.number().int().positive(),
  footprintShape: FootprintShapeSchema,
});

// ---------------------------------------------------------------------------
//  VALIDATION REPORT SCHEMA
// ---------------------------------------------------------------------------

export const ValidationReportSchema = z.object({
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
  materialCountVerified: z.boolean(),
  totalCalculatedBlocks: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
//  TOP-LEVEL BUILD SCHEMA
// ---------------------------------------------------------------------------

export const MinecraftBuildSchema = z.object({
  id: z
    .string()
    .regex(UUID_V4_PATTERN, 'Invalid UUIDv4 format'),
  name: z.string().min(3).max(60),
  description: z.string().min(1).max(300),
  generatedAt: z.string().datetime(),
  theme: ThemeSchema,
  purpose: PurposeSchema,
  biome: BiomeSchema,
  styleTags: z
    .array(
      z.string()
        .min(2)
        .max(30)
        .regex(KEBAB_CASE_PATTERN, 'Tags must be lowercase kebab-case')
    )
    .min(1)
    .max(10),
  difficulty: DifficultySchema,
  progressionLevel: ProgressionLevelSchema,
  estimatedMinutes: z.number().int().min(5).max(600),
  requiredSkills: z.array(z.string()),
  dimensions: DimensionsSchema,
  materials: z.array(MaterialItemSchema).min(1),
  blockPalette: BlockPaletteSchema,
  phases: z.array(PhaseSchema).min(1),
  visualPreview: VisualPreviewSchema,
  validation: ValidationReportSchema.nullable().default(null),
});

export type MinecraftBuild = z.infer<typeof MinecraftBuildSchema>;

// ---------------------------------------------------------------------------
//  BUILD DESIGNER INPUT SCHEMA
// ---------------------------------------------------------------------------

export const BuildDesignerInputSchema = z.object({
  theme: ThemeSchema,
  purpose: PurposeSchema,
  biome: BiomeSchema.optional(),
  maxDifficulty: DifficultySchema.optional(),
  progressionLevel: ProgressionLevelSchema.optional(),
  footprintConstraint: z
    .object({
      maxWidth: z.number().int().positive().optional(),
      maxDepth: z.number().int().positive().optional(),
    })
    .optional(),
  maxHeight: z.number().int().positive().optional(),
  preferredBlocks: z
    .array(z.string().regex(BEDROCK_BLOCK_ID_PATTERN))
    .optional(),
  excludedBlocks: z
    .array(z.string().regex(BEDROCK_BLOCK_ID_PATTERN))
    .optional(),
  additionalNotes: z.string().max(500).optional(),
  targetMinutes: z.number().int().positive().optional(),
});

export type BuildDesignerInput = z.infer<typeof BuildDesignerInputSchema>;

// ---------------------------------------------------------------------------
//  DENO-SIDE ADDITIONS
//  Types the validator imports that the src-side gets from types/build.ts.
// ---------------------------------------------------------------------------

export type MaterialItem = z.infer<typeof MaterialItemSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type ProgressionLevel = z.infer<typeof ProgressionLevelSchema>;
