/**
 * components/ui/Badge.tsx
 *
 * Small inline label used for build categories, difficulty, tags, etc.
 */

import { type ReactNode } from 'react'

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]',
  accent:  'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]',
  success: 'bg-green-500/10 text-[var(--success)] border border-green-500/30',
  warning: 'bg-yellow-500/10 text-[var(--warning)] border border-yellow-500/30',
  danger:  'bg-red-500/10 text-[var(--danger)] border border-red-500/30',
  muted:   'bg-transparent text-[var(--text-muted)] border border-[var(--border-subtle)]',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
