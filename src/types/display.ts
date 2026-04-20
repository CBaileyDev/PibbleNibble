export type BuildDifficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert'
export type BuildProgression = 'Early Game' | 'Mid Game' | 'Late Game' | 'End Game'
export type BuildStatus = 'todo' | 'in-progress' | 'completed'

export interface BuildDisplayData {
  id: string
  name: string
  /** 5 hex color strings representing primary materials */
  palette: string[]
  difficulty: BuildDifficulty
  progression: BuildProgression
  biome?: string
  /** e.g. "12 × 8 × 10" */
  dims: string
  steps: number
  status: BuildStatus
  progress?: { current: number; total: number }
}
