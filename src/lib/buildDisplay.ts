import type { MinecraftBuild } from '@/types/build'
import type { BuildDisplayData, BuildDifficulty, BuildProgression, BuildStatus } from '@/types/display'

const CATEGORY_PALETTE: Record<string, string[]> = {
  house:       ['#5E4028', '#7A5638', '#8AA64A', '#C9B180', '#4B5D2E'],
  farm:        ['#8AA64A', '#C9B180', '#5E4028', '#4B5D2E', '#7A5638'],
  storage:     ['#1E1A1E', '#3C2F30', '#8B6B3F', '#5A4030', '#0F0D10'],
  decoration:  ['#C47B5C', '#E8C9A3', '#6FA5A0', '#3E5A48', '#D8526E'],
  redstone:    ['#AA2020', '#701010', '#2F2F2F', '#555555', '#111111'],
  landmark:    ['#1B2330', '#2E3A4E', '#00B0D9', '#5A6A80', '#0A0D12'],
  underground: ['#1B2330', '#2E3A4E', '#4E5A6A', '#5A6A80', '#0A0D12'],
  other:       ['#5E4028', '#7A5638', '#C9B180', '#8AA64A', '#4B5D2E'],
}

const DIFFICULTY_MAP: Record<string, BuildDifficulty> = {
  easy:   'Easy',
  medium: 'Medium',
  hard:   'Hard',
  expert: 'Expert',
}

const PROGRESSION_MAP: Record<string, BuildProgression> = {
  easy:   'Early Game',
  medium: 'Mid Game',
  hard:   'Late Game',
  expert: 'End Game',
}

const CATEGORY_BIOME: Record<string, string> = {
  house:       'Plains',
  farm:        'Plains',
  storage:     'Cave',
  decoration:  'Forest',
  redstone:    'Any',
  landmark:    'Mountain',
  underground: 'Cave',
  other:       'Forest',
}

export function toBuildDisplay(build: MinecraftBuild): BuildDisplayData {
  const allSteps = build.phases.flatMap((p) => p.steps)
  const totalSteps = allSteps.length
  const completedSteps = allSteps.filter((s) => s.isCompleted).length

  let status: BuildStatus = 'todo'
  if (totalSteps > 0 && completedSteps === totalSteps) status = 'completed'
  else if (completedSteps > 0) status = 'in-progress'

  const { width, height, depth } = build.dimensions
  const dims = `${width} × ${height} × ${depth}`

  return {
    id: build.id,
    name: build.title,
    palette: CATEGORY_PALETTE[build.category] ?? CATEGORY_PALETTE.other,
    difficulty: DIFFICULTY_MAP[build.difficulty] ?? 'Easy',
    progression: PROGRESSION_MAP[build.difficulty] ?? 'Early Game',
    biome: CATEGORY_BIOME[build.category],
    dims,
    steps: totalSteps,
    status,
    progress: totalSteps > 0 ? { current: completedSteps, total: totalSteps } : undefined,
  }
}
