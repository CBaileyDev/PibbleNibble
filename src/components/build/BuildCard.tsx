/**
 * components/build/BuildCard.tsx
 *
 * Library card for a saved build. Renders a palette strip, name,
 * status + difficulty + progression tags, an optional progress bar,
 * and a set of action buttons that vary by state.
 *
 * States:
 *   • saved-only  → no project attached; shows View + Save + Delete
 *   • in-progress → project.status === 'in-progress'; shows Continue + View + Delete
 *   • completed   → project.status === 'done' | 'completed'; shows View + Delete
 */

import { type CSSProperties } from 'react'
import { Eye, Play, Trash2, Bookmark, ArrowRight } from 'lucide-react'
import type { MinecraftBuild } from '@/types/build'

/* ───────────────────────── types ───────────────────────── */

/**
 * Tracker that pairs a saved build with the user's active attempt.
 * Mirrors the shape the rest of the app uses (see Dashboard / ActiveProjectCard).
 */
export interface BuildProject {
  id: string
  buildId: string
  name?: string
  status: 'todo' | 'in-progress' | 'done' | 'completed'
  progress: { current: number; total: number }
  currentStepText?: string
  updatedAt?: string
}

export interface BuildCardProps {
  build: MinecraftBuild
  project?: BuildProject
  onContinue?: () => void
  onView: () => void
  onDelete: () => void
  onSave?: () => void
}

/* ───────────────────────── constants ───────────────────────── */

const FALLBACK_PALETTE = ['#2E3A4E', '#1B2330', '#00CCFF', '#5A6A80', '#131A26']

const PROGRESSION_LABEL: Record<string, string> = {
  early:   'Early Game',
  mid:     'Mid Game',
  late:    'Late Game',
  endgame: 'Endgame',
}

const STATUS_CLASS: Record<string, string> = {
  todo:          'badge-todo',
  'in-progress': 'badge-progress',
  done:          'badge-completed',
  completed:     'badge-completed',
}

const STATUS_LABEL: Record<string, string> = {
  todo:          'Saved',
  'in-progress': 'In Progress',
  done:          'Completed',
  completed:     'Completed',
}

const DIFF_CLASS: Record<string, string> = {
  beginner: 'diff-beginner',
  easy:     'diff-easy',
  medium:   'diff-medium',
  hard:     'diff-hard',
  expert:   'diff-expert',
}

/* ───────────────────────── component ───────────────────────── */

export function BuildCard({
  build,
  project,
  onContinue,
  onView,
  onDelete,
  onSave,
}: BuildCardProps) {
  const name = build.name
  const palette = build.blockPalette?.colorHexes?.length
    ? build.blockPalette.colorHexes
    : FALLBACK_PALETTE
  const progression = build.progressionLevel
  const difficulty = build.difficulty

  const isInProgress = project?.status === 'in-progress'
  const isCompleted  = project?.status === 'done' || project?.status === 'completed'
  const isSavedOnly  = !project

  return (
    <article style={rootStyle}>
      {/* Palette strip */}
      <div style={paletteStripStyle(palette.length)}>
        {palette.map((c, i) => (
          <div
            key={`${c}-${i}`}
            style={{
              background: c,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.25)',
            }}
          />
        ))}
        {project && (
          <div style={statusOverlayStyle}>
            <span className={`badge ${STATUS_CLASS[project.status] ?? ''}`}>
              <span className="badge-dot" />
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        <h3 style={nameStyle}>{name}</h3>

        <div style={tagRowStyle}>
          <span className={`badge ${DIFF_CLASS[difficulty] ?? 'badge-neutral'}`}>
            {capitalize(difficulty)}
          </span>
          {progression && (
            <span className="badge badge-neutral">
              {PROGRESSION_LABEL[progression] ?? progression}
            </span>
          )}
        </div>

        {isInProgress && project && (
          <div style={progressWrapStyle}>
            <div style={progressMetaStyle}>
              <span>Step {project.progress.current} of {project.progress.total}</span>
              <span style={progressPctStyle}>
                {Math.round(
                  (project.progress.current /
                    Math.max(project.progress.total, 1)) *
                    100,
                )}%
              </span>
            </div>
            <div className="chunky-progress">
              <div
                className="chunky-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (project.progress.current /
                        Math.max(project.progress.total, 1)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action footer */}
        <div style={footerStyle}>
          {isSavedOnly && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-full"
                onClick={onView}
              >
                <Eye size={14} aria-hidden />
                View
              </button>
              <div style={secondaryRowStyle}>
                {onSave && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onSave}
                    aria-label="Save build"
                  >
                    <Bookmark size={14} aria-hidden />
                    Save
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onDelete}
                  aria-label="Delete build"
                  style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </>
          )}

          {isInProgress && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-full"
                onClick={onContinue}
              >
                <Play size={14} aria-hidden />
                Continue
                <ArrowRight size={14} aria-hidden />
              </button>
              <div style={secondaryRowStyle}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onView}
                >
                  View Details
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onDelete}
                  aria-label="Delete build"
                  style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </>
          )}

          {isCompleted && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-full"
                onClick={onView}
              >
                <Eye size={14} aria-hidden />
                View Details
              </button>
              <div style={secondaryRowStyle}>
                <span style={doneHintStyle}>✓ Build complete</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onDelete}
                  aria-label="Delete build"
                  style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

/* ───────────────────────── styles ───────────────────────── */

const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  transition:
    'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
}

function paletteStripStyle(count: number): CSSProperties {
  return {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.max(count, 1)}, 1fr)`,
    height: 36,
    flexShrink: 0,
  }
}

const statusOverlayStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 2,
}

const bodyStyle: CSSProperties = {
  padding: '16px 18px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  flex: 1,
}

const nameStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 19,
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: '0.03em',
  color: 'var(--text-primary)',
}

const tagRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
}

const progressWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const progressMetaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
}

const progressPctStyle: CSSProperties = {
  color: 'var(--accent)',
}

const footerStyle: CSSProperties = {
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  paddingTop: 4,
}

const secondaryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const doneHintStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--success)',
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
