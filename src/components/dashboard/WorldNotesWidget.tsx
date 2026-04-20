/**
 * components/dashboard/WorldNotesWidget.tsx
 *
 * Compact list of the most recent world notes/coordinate pins,
 * shown in the Dashboard's sidebar column. Refreshes in real-time
 * via the useWorldNotes Realtime subscription.
 */

import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorldNotes } from '@/hooks/useWorldNotes'

export function WorldNotesWidget() {
  const { data: notes, isLoading } = useWorldNotes()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-10 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!notes?.length) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-4">
        No notes yet.{' '}
        <Link to="/world-notes" className="text-[var(--accent)] hover:underline">
          Add one →
        </Link>
      </p>
    )
  }

  const DIMENSION_EMOJI: Record<string, string> = {
    overworld: '🌿',
    nether:    '🔥',
    end:       '🌑',
  }

  return (
    <div className="flex flex-col gap-1.5">
      {notes.slice(0, 5).map((note) => (
        <div
          key={note.id}
          className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-raised)] transition-colors"
        >
          <MapPin
            size={13}
            className="shrink-0"
            style={{ color: note.pinColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text-primary)] truncate">{note.label}</p>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              {DIMENSION_EMOJI[note.dimension]} {note.x}, {note.y}, {note.z}
            </p>
          </div>
        </div>
      ))}

      {notes.length > 5 && (
        <Link
          to="/world-notes"
          className="text-xs text-[var(--accent)] hover:underline text-right mt-1"
        >
          View all {notes.length} →
        </Link>
      )}
    </div>
  )
}
