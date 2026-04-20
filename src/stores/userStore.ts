/**
 * stores/userStore.ts
 *
 * Zustand store for the authenticated user and their UI preferences.
 * Populated by the useAuth hook after Supabase Auth resolves the session.
 * Persisted to localStorage so the theme doesn't flash on hard refresh.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionUser } from '@/types/user'
import type { Theme } from '@/types/user'

interface UserState {
  user: SessionUser | null
  theme: Theme

  setUser: (user: SessionUser | null) => void
  setTheme: (theme: Theme) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'deepslate',

      setUser: (user) =>
        set({ user, theme: user?.profile.theme ?? 'deepslate' }),

      setTheme: (theme) =>
        set((s) => ({
          theme,
          user: s.user ? { ...s.user, profile: { ...s.user.profile, theme } } : null,
        })),

      clearUser: () => set({ user: null, theme: 'deepslate' }),
    }),
    {
      name: 'pibble-user',
      partialize: (s) => ({ theme: s.theme }),
    }
  )
)
