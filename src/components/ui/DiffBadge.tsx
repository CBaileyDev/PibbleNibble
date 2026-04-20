type DifficultyLevel = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert'

interface DiffBadgeProps {
  level: DifficultyLevel | string
}

export function DiffBadge({ level }: DiffBadgeProps) {
  const key = level.toLowerCase()
  return <span className={`badge diff-${key}`}>{level}</span>
}
