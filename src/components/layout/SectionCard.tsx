/**
 * components/layout/SectionCard.tsx
 *
 * A titled section container used to group related content on a page —
 * e.g. "Recent Builds", "Materials Needed". Accepts an optional action
 * slot (usually a small button or link in the top-right corner).
 */

import { type ReactNode } from 'react'

interface SectionCardProps {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, action, children, className = '' }: SectionCardProps) {
  return (
    <section
      className={[
        'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
