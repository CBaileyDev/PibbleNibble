/**
 * hooks/useTheme.ts
 *
 * Convenience hook for reading and changing the active theme.
 * Must be used inside <ThemeProvider> from components/layout/ThemeProvider.
 */

import { useContext } from 'react'
import { ThemeContext } from '@/components/layout/ThemeProvider'
import type { Theme } from '@/lib/theme'

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  return useContext(ThemeContext)
}
