/**
 * components/dashboard/WorldNotesWidget.tsx
 *
 * Compact list of the user's most recent coordinate pins.
 * Accepts a pre-fetched notes array — does not own its data source
 * so the parent can swap in Supabase data in Phase 7.
 */

import { MapPin, Plus } from 'lucide-react'
import type { WorldNote } from '@/types/project'
import styles from './WorldNotesWidget.module.css'

const DIMENSION_EMOJI: Record<WorldNote['dimension'], string> = {
  overworld: '🌿',
  nether: '🔥',
  end: '🌑',
}

/** Props for WorldNotesWidget. */
export interface WorldNotesWidgetProps {
  /** Coordinate pins to display (shows first 5). */
  notes: WorldNote[]
  /** Called when the user clicks the Add Note button. */
  onAddNote: () => void
}

export function WorldNotesWidget({ notes, onAddNote }: WorldNotesWidgetProps) {
  if (!notes.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No coordinate pins yet.</p>
        <button className="btn btn-secondary btn-sm" onClick={onAddNote}>
          <Plus size={13} />
          Add First Pin
        </button>
      </div>
    )
  }

  return (
    <div className={styles.widget}>
      <div className={styles.list}>
        {notes.slice(0, 5).map((note) => (
          <div key={note.id} className={styles.item}>
            <MapPin
              size={12}
              className={styles.pinIcon}
              style={{ color: note.pinColor }}
            />
            <div className={styles.noteInfo}>
              <span className={styles.noteLabel}>{note.label}</span>
              <span className={styles.noteCoords}>
                {DIMENSION_EMOJI[note.dimension]}&nbsp;{note.x}, {note.y}, {note.z}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={onAddNote}>
        <Plus size={13} />
        Add Note
      </button>
    </div>
  )
}
