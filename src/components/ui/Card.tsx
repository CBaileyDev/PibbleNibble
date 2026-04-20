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
        'card',
        elevated ? 'card-elevated' : '',
        interactive ? 'card-interactive' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} style={{ padding: '16px 20px' }}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}
