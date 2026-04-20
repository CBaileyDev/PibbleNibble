/**
 * components/layout/PageLayout.tsx
 *
 * Standard page wrapper that provides a consistent max-width, padding,
 * and entry animation. Used inside every page component.
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageLayoutProps {
  children: ReactNode
  /** If true, removes the default horizontal padding for full-bleed layouts. */
  flush?: boolean
}

export function PageLayout({ children, flush = false }: PageLayoutProps) {
  return (
    <motion.div
      className={[
        'flex-1',
        flush ? '' : 'px-6 py-6',
      ].join(' ')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
