/**
 * components/ui/Modal.tsx
 *
 * Accessible dialog overlay. Uses Framer Motion for the backdrop fade
 * and panel scale-in animation. On open the previously-focused element
 * is captured, focus moves into the panel, Tab is trapped inside, and
 * Escape or a backdrop click closes. On close focus is restored to the
 * original triggering element.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

/** Selector matching everything the browser treats as tab-focusable. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  )
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null

    // Give the panel a frame to mount, then move focus inside.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const focusables = getFocusable(panel)
      ;(focusables[0] ?? panel).focus({ preventScroll: true })
    })

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = getFocusable(panel)
      if (focusables.length === 0) {
        e.preventDefault()
        panel.focus({ preventScroll: true })
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKey)
      const toRestore = previouslyFocusedRef.current
      previouslyFocusedRef.current = null
      if (toRestore && document.body.contains(toRestore)) {
        toRestore.focus({ preventScroll: true })
      }
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
            className={[
              'relative z-10 w-full rounded-[var(--radius-xl)] border border-[var(--border)]',
              'bg-[var(--surface)] shadow-2xl outline-none',
              maxWidthClasses[maxWidth],
            ].join(' ')}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
