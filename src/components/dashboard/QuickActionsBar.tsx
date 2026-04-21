/**
 * components/dashboard/QuickActionsBar.tsx
 *
 * Horizontal bar of shortcut buttons for the Dashboard's most common actions.
 * All navigation is handled by callbacks so the parent controls routing.
 */

import { Wand2, BookOpen, ClipboardList } from 'lucide-react'
import styles from './QuickActionsBar.module.css'

/** Props for QuickActionsBar. */
export interface QuickActionsBarProps {
  /** Trigger the AI build-generation flow. */
  onGenerateBuild: () => void
  /** Navigate to the saved builds library. */
  onViewBuilds: () => void
  /** Open the material checklists view. */
  onOpenChecklists: () => void
}

export function QuickActionsBar({
  onGenerateBuild,
  onViewBuilds,
  onOpenChecklists,
}: QuickActionsBarProps) {
  return (
    <div className={styles.bar}>
      <button className="btn btn-primary btn-sm" onClick={onGenerateBuild}>
        <Wand2 size={14} />
        Generate Build
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onViewBuilds}>
        <BookOpen size={14} />
        View Builds
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onOpenChecklists}>
        <ClipboardList size={14} />
        Checklists
      </button>
    </div>
  )
}
