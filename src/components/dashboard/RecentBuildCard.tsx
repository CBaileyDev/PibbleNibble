/**
 * components/dashboard/RecentBuildCard.tsx
 *
 * Compact card for the "Recent Builds" grid on the Dashboard.
 * Shows a block-grid thumbnail, build name, difficulty, and progression tier
 * derived from difficulty. Two action buttons: Start and Save.
 */

import type { MinecraftBuild, Difficulty, ProgressionLevel } from '@/types/build'
import styles from './RecentBuildCard.module.css'

const FALLBACK_PALETTE = ['#2E3A4E', '#3C4E62', '#5A6A80', '#1B2330', '#0A0D12']

const DIFF_CLASS: Record<Difficulty, string> = {
  beginner: 'diff-beginner',
  easy: 'diff-easy',
  medium: 'diff-medium',
  hard: 'diff-hard',
  expert: 'diff-expert',
}

const PROGRESSION_LABEL: Record<ProgressionLevel, string> = {
  early:   'Early Game',
  mid:     'Mid Game',
  late:    'Late Game',
  endgame: 'End Game',
}

function paletteColors(build: MinecraftBuild): string[] {
  const hexes = build.blockPalette?.colorHexes
  return hexes && hexes.length > 0 ? hexes : FALLBACK_PALETTE
}

/** Props for RecentBuildCard. */
export interface RecentBuildCardProps {
  /** The build to display. */
  build: MinecraftBuild
  /** Called when the user starts this build. */
  onStart: () => void
  /** Called when the user saves this build to their library. */
  onSave: () => void
}

export function RecentBuildCard({ build, onStart, onSave }: RecentBuildCardProps) {
  const palette = paletteColors(build)

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumbnail} aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className={styles.block}
            style={{ background: palette[i % palette.length] }}
          />
        ))}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.meta}>
          <h4 className={styles.name}>{build.name}</h4>
          <div className={styles.tags}>
            <span className={`badge ${DIFF_CLASS[build.difficulty]}`}>
              {build.difficulty}
            </span>
            <span className="badge badge-neutral">
              {PROGRESSION_LABEL[build.progressionLevel]}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className="btn btn-primary btn-sm" onClick={onStart} style={{ flex: 1 }}>
            Start
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onSave} style={{ flex: 1 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
