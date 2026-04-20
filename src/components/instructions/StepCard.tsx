/**
 * components/instructions/StepCard.tsx
 *
 * A single build step within a phase. Shows step description, optional
 * note, and a checkbox to mark it complete. Completion state persists
 * through the parent useBuild mutation.
 */

import { motion } from 'framer-motion'
import type { BuildStep } from '@/types/build'

interface StepCardProps {
  step: BuildStep
  onToggle: (stepId: string, completed: boolean) => void
}

export function StepCard({ step, onToggle }: StepCardProps) {
  return (
    <motion.div
      layout
      className={[
        'flex gap-3 p-3 rounded-[var(--radius-md)] border transition-colors duration-150',
        step.isCompleted
          ? 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] opacity-60'
          : 'border-[var(--border)] bg-[var(--surface)]',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={step.isCompleted}
        onChange={(e) => onToggle(step.id, e.target.checked)}
        className="mt-0.5 size-4 accent-[var(--accent)] shrink-0 cursor-pointer"
        aria-label={`Mark step ${step.order + 1} complete`}
      />

      <div className="flex flex-col gap-1 min-w-0">
        <p
          className={[
            'text-sm leading-relaxed',
            step.isCompleted
              ? 'line-through text-[var(--text-muted)]'
              : 'text-[var(--text-primary)]',
          ].join(' ')}
        >
          <span className="text-[var(--text-muted)] mr-2 font-mono text-xs">
            {String(step.order + 1).padStart(2, '0')}
          </span>
          {step.description}
        </p>

        {step.note && (
          <p className="text-xs text-[var(--text-muted)] italic pl-6">{step.note}</p>
        )}
      </div>
    </motion.div>
  )
}
