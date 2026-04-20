import { type ReactNode } from 'react'

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'todo'
  | 'progress'
  | 'completed'
  | 'neutral'

const variantClass: Record<BadgeVariant, string> = {
  default:   'badge-neutral',
  neutral:   'badge-neutral',
  accent:    'badge-progress',
  success:   'badge-completed',
  warning:   'badge-progress',
  danger:    'badge-danger',
  muted:     'badge-neutral',
  todo:      'badge-todo',
  progress:  'badge-progress',
  completed: 'badge-completed',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'default', className = '', dot }: BadgeProps) {
  return (
    <span className={['badge', variantClass[variant], className].filter(Boolean).join(' ')}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}
