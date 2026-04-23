/**
 * hooks/useTheme.ts
 *
 * Single source of truth for the active theme. Reads/writes the Zustand
 * userStore (which is persisted to localStorage so the theme doesn't flash
 * on reload) and — when the user is signed in — mirrors the change to the
 * Supabase profiles row so it syncs across sessions and devices.
 *
 * The <ThemeProvider> in src/providers/ThemeProvider.tsx reacts to the
 * Zustand theme value and toggles data-theme on <html>.
 */

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { Theme } from '@/lib/theme'

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const theme = useUserStore((s) => s.theme)
  const setStoreTheme = useUserStore((s) => s.setTheme)
  const userId = useUserStore((s) => s.user?.id)

  const setTheme = useCallback(
    (next: Theme) => {
      setStoreTheme(next)
      if (!userId) return
      void supabase
        .from('profiles')
        .update({ theme: next, updated_at: new Date().toISOString() })
        .eq('auth_id', userId)
    },
    [setStoreTheme, userId],
  )

  return { theme, setTheme }
}
