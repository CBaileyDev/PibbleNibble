/**
 * components/instructions/BuildProgressBar.tsx
 *
 * Horizontal progress bar that computes overall build completion by
 * counting completed steps across all phases. Pure display component —
 * receives the build as a prop and derives the percentage.
 */

import type { MinecraftBuild } from '@/types/build'

interface BuildProgressBarProps {
  build: MinecraftBuild
  showLabel?: boolean
}

export function BuildProgressBar({ build, showLabel = true }: BuildProgressBarProps) {
  const allSteps = build.phases.flatMap((p) => p.steps)
  const completed = allSteps.filter((s) => s.isCompleted).length
  const total = allSteps.length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? 'var(--success)' : 'var(--accent)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums w-12 text-right">
          {completed}/{total}
        </span>
      )}
    </div>
  )
}
