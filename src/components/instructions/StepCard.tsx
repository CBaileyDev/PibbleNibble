/**
 * components/instructions/StepCard.tsx
 *
 * A single build step within a phase. Shows step number + description +
 * optional tip/warning, and a checkbox to mark it complete. Completion
 * state is passed in (it lives in the per-user BuildProject, not on the
 * canonical BuildStep) so this component stays a pure view.
 */

import { motion } from 'framer-motion'
import { usePreferences } from '@/hooks/usePreferences'
import type { BuildStep } from '@/types/build'

interface StepCardProps {
  step: BuildStep
  isCompleted: boolean
  onToggle: (stepId: string) => void
}

export function StepCard({ step, isCompleted, onToggle }: StepCardProps) {
  const { showTips } = usePreferences()
  return (
    <motion.div
      layout
      className={[
        'flex gap-3 p-3 rounded-[var(--radius-md)] border transition-colors duration-150',
        isCompleted
          ? 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] opacity-60'
          : 'border-[var(--border)] bg-[var(--surface)]',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={() => onToggle(step.stepId)}
        className="mt-0.5 size-4 accent-[var(--accent)] shrink-0 cursor-pointer"
        aria-label={`Mark step ${step.stepNumber} (${step.title}) ${isCompleted ? 'incomplete' : 'complete'}`}
      />

      <div className="flex flex-col gap-1 min-w-0">
        <p
          className={[
            'text-sm leading-relaxed',
            isCompleted
              ? 'line-through text-[var(--text-muted)]'
              : 'text-[var(--text-primary)]',
          ].join(' ')}
        >
          <span className="text-[var(--text-muted)] mr-2 font-mono text-xs">
            {String(step.stepNumber).padStart(2, '0')}
          </span>
          <span className="font-semibold">{step.title}</span>
          <span className="mx-1 text-[var(--text-muted)]">—</span>
          {step.description}
        </p>

        {showTips && step.tip && (
          <p className="text-xs text-[var(--text-muted)] italic pl-6">💡 {step.tip}</p>
        )}
        {showTips && step.warning && (
          <p className="text-xs pl-6" style={{ color: 'var(--warning, #FFB020)' }}>
            ⚠️ {step.warning}
          </p>
        )}
      </div>
    </motion.div>
  )
}
