/**
 * components/ui/Card.tsx
 *
 * Surface container used for build cards, stat panels, and modals.
 * The `elevated` prop adds a subtle lift shadow; `interactive` adds
 * hover styles for clickable cards.
 */

import { type ReactNode, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  interactive?: boolean
  children: ReactNode
}

export function Card({
  elevated = false,
  interactive = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-[var(--radius-lg)] border border-[var(--border)]',
        elevated ? 'bg-[var(--surface-raised)]' : 'bg-[var(--surface)]',
        interactive
          ? 'cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:shadow-md'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

/** Convenience sub-components for structured card layouts. */
export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 pt-5 pb-3 border-b border-[var(--border-subtle)] ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 pb-5 pt-3 border-t border-[var(--border-subtle)] ${className}`}>
      {children}
    </div>
  )
}
