/**
 * stores/userStore.ts
 *
 * Zustand store for the authenticated user and their UI preferences.
 * Populated by the useAuth hook after Supabase Auth resolves the session.
 * Persisted to localStorage so the theme doesn't flash on hard refresh.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionUser, UserProfile } from '@/types/user'
import type { Theme } from '@/types/user'

interface UserState {
  user: SessionUser | null
  theme: Theme
  textured: boolean
  /**
   * True once the initial Supabase session check has completed — regardless
   * of whether a user was found. Routes should wait on this before deciding
   * to redirect, otherwise authenticated users get bounced on hard refresh
   * (the persisted store only carries `theme` / `textured`, not `user`).
   */
  authReady: boolean

  setUser: (user: SessionUser | null) => void
  setProfile: (profile: UserProfile) => void
  setTheme: (theme: Theme) => void
  setTextured: (v: boolean) => void
  setAuthReady: (ready: boolean) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'deepslate',
      textured: true,
      authReady: false,

      setUser: (user) =>
        set({ user, theme: user?.profile.theme ?? 'deepslate' }),

      setProfile: (profile) =>
        set((s) => (s.user ? { user: { ...s.user, profile } } : {})),

      setTheme: (theme) =>
        set((s) => ({
          theme,
          user: s.user ? { ...s.user, profile: { ...s.user.profile, theme } } : null,
        })),

      setTextured: (textured) => set({ textured }),

      setAuthReady: (ready) => set({ authReady: ready }),

      clearUser: () => set({ user: null, theme: 'deepslate' }),
    }),
    {
      name: 'pibble-user',
      partialize: (s) => ({ theme: s.theme, textured: s.textured }),
    }
  )
)
