/**
 * Shared test fixtures.
 *
 * `makeValidBuild()` returns a MinecraftBuild that passes BOTH the Zod
 * `MinecraftBuildSchema` and the structural `validateBuild` engine with zero
 * errors, zero warnings, and no auto-corrections. Tests start from this and
 * introduce a single defect to assert on a specific rule.
 */

import type { MinecraftBuild } from '@/types/build'

export function makeValidBuild(
  overrides: Partial<MinecraftBuild> = {},
): MinecraftBuild {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Hearthstone Cottage',
    description: 'A cozy starter cottage with a stone chimney.',
    generatedAt: '2026-04-20T14:32:00.000Z',
    theme: 'cozy',
    purpose: 'cottage',
    biome: 'plains',
    styleTags: ['starter-home', 'cozy'],
    difficulty: 'easy',
    progressionLevel: 'early',
    estimatedMinutes: 30,
    requiredSkills: ['placing stairs'],
    dimensions: {
      width: 7,
      height: 6,
      depth: 7,
      totalBlocks: 60,
      footprintShape: 'rectangle',
    },
    materials: [
      {
        blockId: 'minecraft:oak_planks',
        blockName: 'Oak Planks',
        quantity: 40,
        category: 'structural',
        obtainMethod: 'craft',
        progressionRequired: 'early',
        isOptional: false,
      },
      {
        blockId: 'minecraft:cobblestone',
        blockName: 'Cobblestone',
        quantity: 20,
        category: 'structural',
        obtainMethod: 'mine',
        progressionRequired: 'early',
        isOptional: false,
      },
    ],
    blockPalette: {
      primaryBlocks: [
        'minecraft:oak_planks',
        'minecraft:oak_log',
        'minecraft:cobblestone',
      ],
      accentBlocks: ['minecraft:stone_bricks', 'minecraft:glass'],
      functionalBlocks: ['minecraft:oak_door'],
      colorHexes: ['#b8945f', '#6b5839', '#7f7f7f'],
    },
    phases: [
      {
        phaseId: 1,
        phaseName: 'Foundation',
        phaseDescription: 'Lay the cobblestone foundation slab.',
        estimatedMinutes: 10,
        steps: [
          {
            stepId: 'phase-1_step-1',
            stepNumber: 1,
            title: 'Lay the cobblestone foundation',
            description:
              'Place a 7x7 cobblestone slab to form the base of the cottage on level ground.',
            blocksUsed: [
              {
                blockId: 'minecraft:cobblestone',
                blockName: 'Cobblestone',
                quantity: 20,
              },
            ],
            approximateArea: 'Ground level, full footprint',
            isCheckpoint: true,
            cumulativeMaterialsUsed: [
              { blockId: 'minecraft:cobblestone', total: 20 },
            ],
          },
        ],
      },
      {
        phaseId: 2,
        phaseName: 'Walls',
        phaseDescription: 'Raise the oak plank walls.',
        estimatedMinutes: 20,
        steps: [
          {
            stepId: 'phase-2_step-2',
            stepNumber: 2,
            title: 'Raise the oak plank walls',
            description:
              'Build the four oak plank walls up to four blocks tall, leaving a gap for the door on the south side.',
            blocksUsed: [
              {
                blockId: 'minecraft:oak_planks',
                blockName: 'Oak Planks',
                quantity: 40,
              },
            ],
            approximateArea: 'Perimeter, levels 1-4',
            isCheckpoint: true,
            cumulativeMaterialsUsed: [
              { blockId: 'minecraft:cobblestone', total: 20 },
              { blockId: 'minecraft:oak_planks', total: 40 },
            ],
          },
        ],
      },
    ],
    visualPreview: {
      previewDescription:
        'A cozy cottage with oak plank walls and a cobblestone base.',
      highlightFeature: 'Stone chimney on the east wall',
      colorPalette: ['#b8945f', '#7f7f7f'],
    },
    validation: null,
    ...overrides,
  }
}

/** Deep clone helper so a test mutation never leaks into another test. */
export function cloneBuild(build: MinecraftBuild): MinecraftBuild {
  return JSON.parse(JSON.stringify(build)) as MinecraftBuild
}
