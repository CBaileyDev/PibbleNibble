/**
 * providers/ThemeProvider.tsx
 *
 * Reads the active theme from Zustand userStore and applies
 * data-theme="blossom" (or removes it) on the <html> element.
 * This is the only place theme is applied — all components
 * inherit it via CSS custom properties defined in globals.css.
 *
 * Wrapped around the app in main.tsx so the effect runs before
 * first paint, eliminating theme flash.
 */

import { useEffect, type ReactNode } from 'react'
import { useUserStore } from '@/stores/userStore'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUserStore((s) => s.theme)
  const textured = useUserStore((s) => s.textured)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'blossom') {
      root.setAttribute('data-theme', 'blossom')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [theme])

  useEffect(() => {
    document.body.classList.toggle('textured', textured)
  }, [textured])

  return <>{children}</>
}
