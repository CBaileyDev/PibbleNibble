/**
 * components/instructions/BuildProgressBar.tsx
 *
 * Horizontal progress bar that computes overall build completion from
 * the per-user `completedStepIds` set against the build's total step
 * count. Pure display component.
 */

import { useMemo } from 'react'
import type { MinecraftBuild } from '@/types/build'

interface BuildProgressBarProps {
  build: MinecraftBuild
  completedStepIds: Set<string>
  showLabel?: boolean
}

export function BuildProgressBar({
  build,
  completedStepIds,
  showLabel = true,
}: BuildProgressBarProps) {
  const { completed, total, pct } = useMemo(() => {
    const allSteps = build.phases.flatMap((p) => p.steps)
    const totalCount = allSteps.length
    const completedCount = allSteps.reduce(
      (n, s) => (completedStepIds.has(s.stepId) ? n + 1 : n),
      0,
    )
    return {
      completed: completedCount,
      total: totalCount,
      pct: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
    }
  }, [build.phases, completedStepIds])

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Build progress: ${completed} of ${total} steps complete`}
      >
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
