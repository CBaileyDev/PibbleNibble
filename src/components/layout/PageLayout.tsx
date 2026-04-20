/**
 * components/layout/PageLayout.tsx
 *
 * Standard page wrapper: constrained max-width, consistent padding, and an
 * optional rich page header (breadcrumb → title → subtitle → actions).
 *
 * All existing pages that call <PageLayout> / <PageLayout flush> continue to
 * work because every new prop is optional — the header section only renders
 * when at least one of title/subtitle/breadcrumb/headerActions is provided.
 */

import { type ReactNode } from 'react'
import styles from './PageLayout.module.css'

export interface PageLayoutProps {
  /** Display-font page title. Renders the header block when provided. */
  title?: string
  /** Muted body-font line beneath the title. */
  subtitle?: string
  /** Slot rendered above the title — e.g. a breadcrumb trail. */
  breadcrumb?: ReactNode
  /** Right-aligned slot in the header row — e.g. a CTA button. */
  headerActions?: ReactNode
  /** Remove horizontal/vertical padding for full-bleed layouts. */
  flush?: boolean
  children: ReactNode
}

const hasHeader = (p: PageLayoutProps) =>
  p.title || p.subtitle || p.breadcrumb || p.headerActions

export function PageLayout(props: PageLayoutProps) {
  const { title, subtitle, breadcrumb, headerActions, flush, children } = props

  return (
    <div className={`${styles.root} ${flush ? styles.flush : ''}`}>
      <div className={styles.inner}>
        {hasHeader(props) && (
          <header className={styles.pageHeader}>
            {breadcrumb && (
              <div className={styles.breadcrumb}>{breadcrumb}</div>
            )}

            <div className={styles.titleRow}>
              <div className={styles.titles}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>

              {headerActions && (
                <div className={styles.actions}>{headerActions}</div>
              )}
            </div>
          </header>
        )}

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
