/**
 * components/instructions/PhaseTabBar.tsx
 *
 * Horizontal tab bar for switching between build phases
 * (Foundation → Walls → Roof → Interior → Details). The active tab has a
 * sliding underline indicator. Completion counts are derived from the
 * `completedStepIds` set (per-user state, not the build itself).
 */

import { motion } from 'framer-motion'
import type { Phase } from '@/types/build'

interface PhaseTabBarProps {
  phases: Phase[]
  activePhaseId: number
  completedStepIds: Set<string>
  onSelect: (phaseId: number) => void
}

export function PhaseTabBar({
  phases,
  activePhaseId,
  completedStepIds,
  onSelect,
}: PhaseTabBarProps) {
  return (
    <div
      className="flex gap-0 border-b border-[var(--border)] overflow-x-auto"
      role="tablist"
      aria-label="Build phases"
    >
      {phases.map((phase) => {
        const isActive = phase.phaseId === activePhaseId
        const totalSteps = phase.steps.length
        const completedSteps = phase.steps.reduce(
          (n, s) => (completedStepIds.has(s.stepId) ? n + 1 : n),
          0,
        )

        return (
          <button
            key={phase.phaseId}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(phase.phaseId)}
            className={[
              'relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            <span>{phase.phaseName}</span>
            <span className="ml-2 text-xs opacity-60">
              {completedSteps}/{totalSteps}
            </span>

            {isActive && (
              <motion.div
                layoutId="phase-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
