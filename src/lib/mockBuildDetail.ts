/**
 * lib/mockBuildDetail.ts
 *
 * Static mock MinecraftBuild used by the Build Detail page until the
 * Supabase-backed hook lands in Phase 7. Faithfully recreates the
 * "Mossy Oak Cottage" prototype from the design handoff (4 phases,
 * 28 steps, 31 materials) against the strict MinecraftBuild schema.
 */

import type {
  MinecraftBuild,
  Phase,
  BuildStep,
  MaterialItem,
  StepBlockUsage,
  CumulativeMaterial,
  MaterialCategory,
} from '@/types/build'

type StepSpec = {
  title: string
  description: string
  area: string
  blocks: Array<[blockId: string, qty: number]>
  tip?: string
  warning?: string
  isCheckpoint?: boolean
}

type PhaseSpec = {
  phaseId: number
  phaseName: string
  phaseDescription: string
  estimatedMinutes: number
  steps: StepSpec[]
}

const BLOCK_NAMES: Record<string, string> = {
  'minecraft:oak_log':            'Oak Log',
  'minecraft:oak_planks':         'Oak Planks',
  'minecraft:stripped_oak_log':   'Stripped Oak Log',
  'minecraft:cobblestone':        'Cobblestone',
  'minecraft:stone_bricks':       'Stone Bricks',
  'minecraft:mossy_cobblestone':  'Mossy Cobblestone',
  'minecraft:coarse_dirt':        'Coarse Dirt',
  'minecraft:grass_block':        'Grass Block',
  'minecraft:moss_block':         'Moss Block',
  'minecraft:vine':               'Vines',
  'minecraft:hay_block':          'Hay Bale',
  'minecraft:spruce_planks':      'Spruce Planks',
  'minecraft:dark_oak_stairs':    'Dark Oak Stairs',
  'minecraft:cobblestone_stairs': 'Cobblestone Stairs',
  'minecraft:oak_fence':          'Oak Fence',
  'minecraft:oak_door':           'Oak Door',
  'minecraft:glass_pane':         'Glass Pane',
  'minecraft:lantern':            'Lantern',
  'minecraft:torch':              'Torch',
  'minecraft:flower_pot':         'Flower Pot',
  'minecraft:chest':              'Chest',
  'minecraft:crafting_table':     'Crafting Table',
  'minecraft:furnace':            'Furnace',
  'minecraft:red_bed':            'Red Bed',
  'minecraft:bookshelf':          'Bookshelf',
  'minecraft:iron_ingot':         'Iron Ingot',
  'minecraft:stone_slab':         'Stone Slab',
  'minecraft:cobblestone_wall':   'Cobblestone Wall',
  'minecraft:oak_sapling':        'Oak Sapling',
  'minecraft:oak_leaves':         'Oak Leaves',
  'minecraft:large_fern':         'Large Fern',
}

const CATEGORIES: Record<string, MaterialCategory> = {
  'minecraft:oak_log':            'structural',
  'minecraft:oak_planks':         'structural',
  'minecraft:stripped_oak_log':   'structural',
  'minecraft:cobblestone':        'structural',
  'minecraft:stone_bricks':       'structural',
  'minecraft:coarse_dirt':        'structural',
  'minecraft:grass_block':        'structural',
  'minecraft:spruce_planks':      'structural',

  'minecraft:mossy_cobblestone':  'decorative',
  'minecraft:moss_block':         'decorative',
  'minecraft:vine':               'decorative',
  'minecraft:hay_block':          'decorative',
  'minecraft:dark_oak_stairs':    'decorative',
  'minecraft:cobblestone_stairs': 'decorative',
  'minecraft:oak_fence':          'decorative',
  'minecraft:glass_pane':         'decorative',
  'minecraft:oak_leaves':         'decorative',
  'minecraft:large_fern':         'decorative',
  'minecraft:flower_pot':         'decorative',
  'minecraft:oak_sapling':        'decorative',
  'minecraft:stone_slab':         'decorative',
  'minecraft:cobblestone_wall':   'decorative',
  'minecraft:oak_door':           'decorative',

  'minecraft:chest':              'functional',
  'minecraft:crafting_table':     'functional',
  'minecraft:furnace':            'functional',
  'minecraft:red_bed':            'functional',
  'minecraft:bookshelf':          'functional',
  'minecraft:lantern':            'functional',
  'minecraft:torch':              'functional',
  'minecraft:iron_ingot':         'rare',
}

const PHASE_SPECS: PhaseSpec[] = [
  {
    phaseId: 1,
    phaseName: 'Foundation',
    phaseDescription: 'Clear the site, lay the cobblestone footing, and fill the floor.',
    estimatedMinutes: 28,
    steps: [
      {
        title: 'Clear and level a 10×10 patch',
        description:
          'Find a gentle forest clearing and flatten a 10×10 footprint. Save any grass blocks you break — you\'ll replant the perimeter later for that lived-in look.',
        area: 'Build site, ground level',
        blocks: [['minecraft:grass_block', 8], ['minecraft:coarse_dirt', 12]],
        tip: 'Look for a spot that already has a few trees nearby — the cottage reads best tucked between trunks.',
      },
      {
        title: 'Dig out the footprint one block deep',
        description:
          'Remove the top layer inside the 10×10 area. This lets the floor sit flush with the surrounding grass so nothing looks perched on top.',
        area: 'Full footprint, 1 block deep',
        blocks: [['minecraft:coarse_dirt', 10]],
      },
      {
        title: 'Lay the cobblestone base ring',
        description:
          'Outline the full 10×10 with cobblestone. This is your footing — the walls will rise from this line.',
        area: 'Outer perimeter, ground level',
        blocks: [['minecraft:cobblestone', 36]],
      },
      {
        title: 'Fill the floor with oak planks',
        description:
          'Fill the 8×8 interior with oak planks, flush with the cobble ring. Mix in 4 stripped oak blocks at random for a weathered, patchy look.',
        area: 'Interior floor',
        blocks: [['minecraft:oak_planks', 60], ['minecraft:stripped_oak_log', 4]],
        isCheckpoint: true,
      },
      {
        title: 'Build the chimney footing',
        description:
          'On the south wall, outside the main footprint, lay a 2×2 cobblestone pad. This is where the chimney will rise.',
        area: 'South wall, exterior',
        blocks: [['minecraft:cobblestone', 4]],
      },
      {
        title: 'Stone brick threshold at the door',
        description:
          'Replace the three cobblestone blocks at your main entry (north side) with stone brick. It\'s a small detail but sells the "well-trodden path" feeling.',
        area: 'North wall, doorway',
        blocks: [['minecraft:stone_bricks', 3]],
      },
      {
        title: 'Perimeter moss scatter',
        description:
          'Randomly swap about a third of the cobble ring for mossy cobblestone. Irregular clusters read way better than an even checkerboard.',
        area: 'Outer perimeter',
        blocks: [['minecraft:mossy_cobblestone', 12]],
      },
    ],
  },
  {
    phaseId: 2,
    phaseName: 'Walls',
    phaseDescription: 'Raise the timber frame, infill the walls, and stand the chimney.',
    estimatedMinutes: 32,
    steps: [
      {
        title: 'Raise the four corner posts',
        description:
          'Stack 4 oak logs at each corner of the footprint. These are the structural beams — everything else will tie back to them.',
        area: 'All four corners',
        blocks: [['minecraft:oak_log', 16]],
      },
      {
        title: 'Fill the north and south walls',
        description:
          'Between the corner posts, fill the wall openings with oak planks, 4 blocks high. Leave a 1-wide gap at the center of the north wall for the door.',
        area: 'North & south walls',
        blocks: [['minecraft:oak_planks', 22]],
      },
      {
        title: 'Frame the east and west walls',
        description:
          'Same approach: fill between the corner posts with oak planks, 4 blocks high. On the east wall, leave a 1×1 hole at head height for a small window. On the west, leave a 1×2 gap for the main view window.',
        area: 'East & west walls',
        blocks: [['minecraft:oak_planks', 20], ['minecraft:glass_pane', 3]],
        tip: 'Place the glass panes now while the walls are still open — reaching in later is a pain.',
      },
      {
        title: 'Add the horizontal timber band',
        description:
          'Halfway up the wall (row 2), swap one full course of planks for stripped oak. This reads as a load-bearing beam and instantly makes the cottage feel built, not boxed.',
        area: 'All walls, row 2',
        blocks: [['minecraft:stripped_oak_log', 18]],
      },
      {
        title: 'Place the oak door',
        description:
          'Drop the oak door into the 1-wide gap on the north wall. Add an iron ingot floating-item if you want a visible doorknob — optional but charming.',
        area: 'North wall, door gap',
        blocks: [['minecraft:oak_door', 1], ['minecraft:iron_ingot', 1]],
        warning:
          'If your door places facing the wrong way, break it and replace from OUTSIDE the cottage.',
      },
      {
        title: 'Chimney stack up to the eaves',
        description:
          'From the 2×2 pad you laid earlier, stack mossy cobblestone up to roof height (7 blocks tall). Leave the interior hollow — you\'ll hollow it from inside later for the fireplace.',
        area: 'South wall, chimney pad',
        blocks: [['minecraft:mossy_cobblestone', 14]],
      },
      {
        title: 'Vines cascading from the top course',
        description:
          'On the east and south walls, place vines on the top plank row. Let them hang naturally — 2 to 4 blocks long. Avoid a uniform curtain.',
        area: 'East & south walls, top row',
        blocks: [['minecraft:vine', 12]],
        isCheckpoint: true,
      },
    ],
  },
  {
    phaseId: 3,
    phaseName: 'Roof',
    phaseDescription: 'Pitch the rafters, cap the ridge, and weather the shingles.',
    estimatedMinutes: 30,
    steps: [
      {
        title: 'Lay the top plate',
        description:
          'Cap the walls with a full ring of stripped oak. This is the seat the rafters will rest on.',
        area: 'Wall tops, full ring',
        blocks: [['minecraft:stripped_oak_log', 22]],
      },
      {
        title: 'Run the ridge beam',
        description:
          'Down the center of the cottage, stack two oak logs to create the ridge. The roof pitches away from here.',
        area: 'Roof ridge, center',
        blocks: [['minecraft:oak_log', 8]],
      },
      {
        title: 'Stair the first pitch',
        description:
          'From the top plate, run dark oak stairs up toward the ridge on both sides. Work one row at a time, both sides together, so the pitch stays symmetrical.',
        area: 'Both roof pitches',
        blocks: [['minecraft:dark_oak_stairs', 18]],
      },
      {
        title: 'Cap the ridge with thatch',
        description:
          'Replace the top course with hay, two blocks wide along the ridgeline. The color break sells the "old cottage" look.',
        area: 'Roof ridge',
        blocks: [['minecraft:hay_block', 16]],
      },
      {
        title: 'Eaves and overhang',
        description:
          'Add dark oak stairs flipped upside-down along the outer edge of the top plate. A 1-block overhang shades the upper walls and feels way more finished.',
        area: 'Wall tops, eaves',
        blocks: [['minecraft:dark_oak_stairs', 14]],
      },
      {
        title: 'Thatch patches on the pitch',
        description:
          'Randomly swap about 10 of the stair blocks on each pitch for thatch. Irregular groupings of 2–3 — never singles, never lines.',
        area: 'Both roof pitches',
        blocks: [['minecraft:hay_block', 20]],
      },
      {
        title: 'Moss the north-facing pitch',
        description:
          'The north face gets less sun, so place moss blocks over maybe 20% of it. Cluster them near the eaves where damp would collect.',
        area: 'North roof pitch',
        blocks: [['minecraft:moss_block', 10]],
        isCheckpoint: true,
      },
    ],
  },
  {
    phaseId: 4,
    phaseName: 'Details',
    phaseDescription: 'Furnish the interior and plant the surrounding garden.',
    estimatedMinutes: 26,
    steps: [
      {
        title: 'Hollow the chimney and add a fireplace',
        description:
          'Break out the inside of the chimney stack at floor level. Place a furnace facing into the room — that\'s your hearth.',
        area: 'Interior, south wall',
        blocks: [['minecraft:furnace', 1]],
      },
      {
        title: 'Bed nook on the east wall',
        description:
          'Tuck a red bed into the east corner, head against the wall. Frame it with two oak fence pieces as rustic bedposts.',
        area: 'Interior, east corner',
        blocks: [['minecraft:red_bed', 1], ['minecraft:oak_fence', 2]],
      },
      {
        title: 'Crafting corner',
        description:
          'Against the west wall, place a crafting table flanked by two bookshelves. Drop a lantern on top of the crafting table for warm light.',
        area: 'Interior, west wall',
        blocks: [
          ['minecraft:crafting_table', 1],
          ['minecraft:bookshelf', 2],
          ['minecraft:lantern', 1],
        ],
      },
      {
        title: 'Storage row',
        description:
          'Two chests side-by-side along the south wall near the fireplace. A third bookshelf above them. Torches every 3 blocks on the walls for ambient glow.',
        area: 'Interior, south wall',
        blocks: [
          ['minecraft:chest', 2],
          ['minecraft:bookshelf', 1],
          ['minecraft:torch', 8],
        ],
      },
      {
        title: 'Porch and front step',
        description:
          'Outside the door, lay a 3×2 stone-brick pad and frame it with two cobble walls as pillars. Hang a lantern from each.',
        area: 'North exterior, porch',
        blocks: [
          ['minecraft:stone_bricks', 6],
          ['minecraft:cobblestone_wall', 2],
          ['minecraft:lantern', 2],
        ],
      },
      {
        title: 'Garden beds and flowerpots',
        description:
          'Plant three flower pots on the porch rail. Scatter tall ferns along the east wall, and drop a few saplings in the clearing out front.',
        area: 'Exterior, garden',
        blocks: [
          ['minecraft:flower_pot', 3],
          ['minecraft:large_fern', 6],
          ['minecraft:oak_sapling', 4],
        ],
        tip: 'A single asymmetric planting (two on one side, one on the other) always beats a symmetric row.',
      },
      {
        title: 'Final pass: leaves and canopy',
        description:
          'Add oak leaves around the roofline where branches might overhang. Place 2 torches in the clearing to invite the eye inward.',
        area: 'Roofline & clearing',
        blocks: [['minecraft:oak_leaves', 24], ['minecraft:torch', 4]],
      },
    ],
  },
]

function blockName(id: string): string {
  return BLOCK_NAMES[id] ?? id.replace(/^minecraft:/, '').replace(/_/g, ' ')
}

function buildPhases(): Phase[] {
  let stepCounter = 0
  const runningTotals: Record<string, number> = {}

  return PHASE_SPECS.map((phase): Phase => {
    const steps: BuildStep[] = phase.steps.map((step): BuildStep => {
      stepCounter += 1

      const blocksUsed: StepBlockUsage[] = step.blocks.map(([id, qty]) => ({
        blockId: id,
        blockName: blockName(id),
        quantity: qty,
      }))

      blocksUsed.forEach((b) => {
        runningTotals[b.blockId] = (runningTotals[b.blockId] ?? 0) + b.quantity
      })

      const cumulativeMaterialsUsed: CumulativeMaterial[] = Object.entries(
        runningTotals,
      ).map(([blockId, total]) => ({ blockId, total }))

      const built: BuildStep = {
        stepId: `phase-${phase.phaseId}_step-${stepCounter}`,
        stepNumber: stepCounter,
        title: step.title,
        description: step.description,
        blocksUsed,
        approximateArea: step.area,
        isCheckpoint: step.isCheckpoint ?? false,
        cumulativeMaterialsUsed,
      }
      if (step.tip) built.tip = step.tip
      if (step.warning) built.warning = step.warning
      return built
    })

    return {
      phaseId: phase.phaseId,
      phaseName: phase.phaseName,
      phaseDescription: phase.phaseDescription,
      estimatedMinutes: phase.estimatedMinutes,
      steps,
    }
  })
}

function buildMaterials(phases: Phase[]): MaterialItem[] {
  const totals = new Map<string, number>()
  phases.forEach((p) =>
    p.steps.forEach((s) =>
      s.blocksUsed.forEach((b) =>
        totals.set(b.blockId, (totals.get(b.blockId) ?? 0) + b.quantity),
      ),
    ),
  )

  return Array.from(totals.entries()).map(([blockId, quantity]): MaterialItem => ({
    blockId,
    blockName: blockName(blockId),
    quantity,
    category: CATEGORIES[blockId] ?? 'decorative',
    obtainMethod: blockId.includes('ingot') ? 'smelt' : blockId.includes('planks') ? 'craft' : 'mine',
    progressionRequired: 'early',
    isOptional: CATEGORIES[blockId] === 'decorative' && !['minecraft:mossy_cobblestone', 'minecraft:oak_door'].includes(blockId),
  }))
}

const PHASES = buildPhases()
const MATERIALS = buildMaterials(PHASES)
const TOTAL_BLOCKS = MATERIALS.reduce((sum, m) => sum + m.quantity, 0)

export const MOSSY_OAK_COTTAGE: MinecraftBuild = {
  id: 'mossy-oak-cottage',
  name: 'Mossy Oak Cottage',
  description:
    'A cozy forest cottage with a timber-framed shell, moss-scattered cobble base, and a steep dark-oak roof. Perfect for an early-game homestead tucked between the trees.',
  generatedAt: '2026-04-20T14:32:00Z',
  theme: 'cozy',
  purpose: 'cottage',
  biome: 'forest',
  styleTags: ['starter-home', 'timber-frame', 'moss-covered', 'chimney', 'garden'],
  difficulty: 'beginner',
  progressionLevel: 'early',
  estimatedMinutes: 116,
  requiredSkills: ['placing stairs', 'mixing blocks', 'basic framing'],
  dimensions: {
    width: 8,
    height: 6,
    depth: 8,
    totalBlocks: TOTAL_BLOCKS,
    footprintShape: 'rectangle',
  },
  materials: MATERIALS,
  blockPalette: {
    primaryBlocks: [
      'minecraft:oak_planks',
      'minecraft:oak_log',
      'minecraft:cobblestone',
      'minecraft:mossy_cobblestone',
    ],
    accentBlocks: ['minecraft:stripped_oak_log', 'minecraft:dark_oak_stairs', 'minecraft:hay_block'],
    functionalBlocks: [
      'minecraft:oak_door',
      'minecraft:crafting_table',
      'minecraft:chest',
      'minecraft:furnace',
      'minecraft:lantern',
    ],
    colorHexes: ['#C49A5F', '#8B6B3F', '#8A8F98', '#6A7A4E'],
  },
  phases: PHASES,
  visualPreview: {
    previewDescription:
      'A cozy timber-and-cobble cottage tucked in a forest clearing. Vines drape the south and east walls, and a stone chimney pokes through a moss-patched dark-oak roof.',
    highlightFeature: 'Cascading vines and a weathered moss-scattered cobble base',
    colorPalette: ['#C49A5F', '#8B6B3F', '#8A8F98', '#6A7A4E', '#3E6B22'],
  },
  validation: null,
}

export function getMockBuild(buildId?: string): MinecraftBuild {
  void buildId
  return MOSSY_OAK_COTTAGE
}
