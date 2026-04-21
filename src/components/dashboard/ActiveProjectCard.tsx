/**
 * components/dashboard/ActiveProjectCard.tsx
 *
 * Hero card for the Dashboard's "Active Project" section. Shows a block-grid
 * thumbnail derived from the build's color palette, progress bar, current step,
 * and a Continue button.
 */

import type { MinecraftBuild, Difficulty } from '@/types/build'
import type { BuildProject } from '@/types/project'
import styles from './ActiveProjectCard.module.css'

const FALLBACK_PALETTE = ['#2E3A4E', '#1B2330', '#00CCFF', '#5A6A80', '#131A26']

const DIFF_CLASS: Record<Difficulty, string> = {
  easy: 'diff-easy',
  medium: 'diff-medium',
  hard: 'diff-hard',
  expert: 'diff-expert',
}

const STATUS_LABEL: Record<BuildProject['status'], string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
  completed: 'Completed',
}

/** Props for ActiveProjectCard. */
export interface ActiveProjectCardProps {
  /** Project tracker holding status, progress, and current step. */
  project: BuildProject
  /** The build definition supplying title, difficulty, and block palette. */
  build: MinecraftBuild
  /** Called when the user clicks the Continue button. */
  onContinue: () => void
}

export function ActiveProjectCard({ project, build, onContinue }: ActiveProjectCardProps) {
  const palette = build.blockPalette?.length ? build.blockPalette : FALLBACK_PALETTE
  const { current, total } = project.progress
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={styles.card}>
      {/* Block-grid thumbnail */}
      <div className={styles.thumbnail} aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className={styles.block}
            style={{ background: palette[i % palette.length] }}
          />
        ))}
      </div>

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <span className={styles.kicker}>Active Project</span>
            <h3 className={styles.name}>{project.name || build.title}</h3>
          </div>
          <div className={styles.badges}>
            <span
              className={`badge ${
                project.status === 'in-progress' ? 'badge-progress' : 'badge-todo'
              }`}
            >
              {STATUS_LABEL[project.status]}
            </span>
            <span className={`badge ${DIFF_CLASS[build.difficulty]}`}>
              {build.difficulty}
            </span>
          </div>
        </div>

        {/* Current step */}
        {project.currentStepText && (
          <p className={styles.stepText}>
            <span className={styles.stepPrefix}>Next —</span>{' '}
            {project.currentStepText}
          </p>
        )}

        {/* Progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>Build progress</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
          <div className="chunky-progress">
            <div className="chunky-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.stepCount}>
            {current} / {total} steps
          </span>
        </div>

        {/* CTA */}
        <button className="btn btn-primary btn-sm" onClick={onContinue}>
          Continue Building →
        </button>
      </div>
    </div>
  )
}
