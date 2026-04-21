/**
 * components/dashboard/StatCard.tsx
 *
 * KPI tile shown in the stats row at the top of the Dashboard.
 * Accepts any Lucide icon and an optional trend indicator.
 */

import type { LucideIcon } from 'lucide-react'
import styles from './StatCard.module.css'

/** Direction of a trend movement. */
export type TrendDirection = 'up' | 'down'

/** Trend data attached to a stat metric. */
export interface TrendData {
  /** Absolute change value (e.g. 3 for +3 builds). */
  value: number
  direction: TrendDirection
}

/** Props for the StatCard KPI tile. */
export interface StatCardProps {
  /** Lucide icon rendered inside the accent bubble. */
  icon: LucideIcon
  /** Primary metric value — displayed in large display numerals. */
  value: string | number
  /** Short descriptive label below the value. */
  label: string
  /** Optional trend indicator showing recent movement. */
  trend?: TrendData
}

export function StatCard({ icon: Icon, value, label, trend }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className={styles.body}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
        {trend && (
          <span
            className={`${styles.trend} ${
              trend.direction === 'up' ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'}&nbsp;{trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
