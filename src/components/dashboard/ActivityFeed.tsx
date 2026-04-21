/**
 * components/dashboard/ActivityFeed.tsx
 *
 * Chronological list of recent user actions on the Dashboard.
 * Takes a pre-built activities array — no Supabase query here; the parent
 * supplies data so we can swap in real queries in Phase 7.
 */

import type { ReactNode } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Save, Play } from 'lucide-react'
import styles from './ActivityFeed.module.css'

/** A single entry in the activity timeline. */
export interface ActivityItem {
  id: string
  /** Human-readable description shown in the feed row. */
  message: string
  /** ISO 8601 timestamp string. */
  timestamp: string
  /** Determines the icon and accent colour for the row. */
  type: 'complete' | 'save' | 'start'
}

/** Props for ActivityFeed. */
export interface ActivityFeedProps {
  /** Ordered list of activity items, newest first. */
  activities: ActivityItem[]
}

const ICONS: Record<ActivityItem['type'], ReactNode> = {
  complete: <CheckCircle size={13} />,
  save: <Save size={13} />,
  start: <Play size={13} />,
}

const ICON_COLOR: Record<ActivityItem['type'], string> = {
  complete: 'var(--success)',
  save: 'var(--accent)',
  start: 'var(--warning)',
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities.length) {
    return (
      <p className={styles.empty}>No activity yet. Go build something!</p>
    )
  }

  return (
    <div className={styles.feed}>
      {activities.map((item) => (
        <div key={item.id} className={styles.item}>
          <div
            className={styles.iconWrap}
            style={{ color: ICON_COLOR[item.type] }}
          >
            {ICONS[item.type]}
          </div>
          <p className={styles.message}>{item.message}</p>
          <time className={styles.time} dateTime={item.timestamp}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </time>
        </div>
      ))}
    </div>
  )
}
