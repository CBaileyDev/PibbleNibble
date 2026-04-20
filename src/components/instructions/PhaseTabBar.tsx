/**
 * components/instructions/PhaseTabBar.tsx
 *
 * Horizontal tab bar for switching between build phases
 * (Foundation → Walls → Roof → Interior → Details).
 * The active tab has a sliding underline indicator.
 */

import { motion } from 'framer-motion'
import type { BuildPhase } from '@/types/build'

interface PhaseTabBarProps {
  phases: BuildPhase[]
  activePhaseId: string
  onSelect: (phaseId: string) => void
}

export function PhaseTabBar({ phases, activePhaseId, onSelect }: PhaseTabBarProps) {
  return (
    <div className="flex gap-0 border-b border-[var(--border)] overflow-x-auto">
      {phases.map((phase) => {
        const isActive = phase.id === activePhaseId
        const completedSteps = phase.steps.filter((s) => s.isCompleted).length
        const totalSteps = phase.steps.length

        return (
          <button
            key={phase.id}
            onClick={() => onSelect(phase.id)}
            className={[
              'relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            <span>{phase.name}</span>
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
