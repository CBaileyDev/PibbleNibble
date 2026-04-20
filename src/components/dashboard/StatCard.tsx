/**
 * components/dashboard/StatCard.tsx
 *
 * Small KPI tile shown at the top of the Dashboard (total builds,
 * materials gathered, tasks done, etc.). Accepts a Lucide icon.
 */

import { type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  delta?: string
  deltaPositive?: boolean
}

export function StatCard({ label, value, icon, delta, deltaPositive }: StatCardProps) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className="p-2 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] text-[var(--accent)] shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
        <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
          {value}
        </span>
        {delta && (
          <span
            className={`text-xs font-medium ${
              deltaPositive ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {delta}
          </span>
        )}
      </div>
    </Card>
  )
}
