/**
 * components/dashboard/ActivityFeed.tsx
 *
 * Chronological feed of recent app events (builds created, tasks moved,
 * notes added). Queries the `activity_events` Supabase table.
 */

import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ActivityEvent } from '@/types/project'

const EVENT_ICONS: Record<ActivityEvent['type'], string> = {
  build_created:    '⛏️',
  build_completed:  '✅',
  task_moved:       '📋',
  note_added:       '📍',
  material_checked: '📦',
}

function useActivityFeed() {
  return useQuery({
    queryKey: ['activity_feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as ActivityEvent[]
    },
  })
}

export function ActivityFeed() {
  const { data: events, isLoading } = useActivityFeed()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-9 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!events?.length) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-4">
        No activity yet. Go build something!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 px-2 py-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-raised)] transition-colors"
        >
          <span className="text-base shrink-0">{EVENT_ICONS[event.type]}</span>
          <p className="flex-1 text-sm text-[var(--text-secondary)] min-w-0 truncate">
            {event.label}
          </p>
          <span className="text-xs text-[var(--text-muted)] shrink-0 tabular-nums">
            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  )
}
