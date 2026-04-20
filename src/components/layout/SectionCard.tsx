/**
 * components/layout/SectionCard.tsx
 *
 * Card container for grouping related content on a page.
 * The header row (title + optional subtitle + optional action) only renders
 * when at least one of title/subtitle/headerAction is provided.
 *
 * Backward-compat notes:
 * - title is now optional (was required)
 * - `action` is kept as a deprecated alias for `headerAction`
 * - `className` is kept for callers that size/position the card externally
 */

import { type ReactNode } from 'react'
import styles from './SectionCard.module.css'

export type SectionCardPadding = 'sm' | 'md' | 'lg'

export interface SectionCardProps {
  title?: string
  subtitle?: string
  /** Right-aligned header slot. */
  headerAction?: ReactNode
  /** @deprecated — use headerAction */
  action?: ReactNode
  padding?: SectionCardPadding
  children: ReactNode
  className?: string
}

const PADDING_CLASS: Record<SectionCardPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
}

export function SectionCard({
  title,
  subtitle,
  headerAction,
  action,
  padding = 'md',
  children,
  className = '',
}: SectionCardProps) {
  const resolvedAction = headerAction ?? action
  const showHeader = title || subtitle || resolvedAction

  return (
    <section className={`${styles.card} ${className}`}>
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {resolvedAction && (
            <div className={styles.headerAction}>{resolvedAction}</div>
          )}
        </div>
      )}

      <div className={`${styles.body} ${PADDING_CLASS[padding]}`}>
        {children}
      </div>
    </section>
  )
}
