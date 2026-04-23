/**
 * hooks/useUserProfile.ts
 *
 * Reads and writes the authenticated user's profile row. Exposes
 * targeted mutators for theme, display name, and the preferences
 * JSONB column. The Zustand user store is kept in sync for theme
 * updates so the UI re-skins immediately.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import {
  DEFAULT_USER_PREFERENCES,
  type Theme,
  type UserPreferences,
  type UserProfile,
} from '@/types/user'

type Err = Error | null

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    authId: row.auth_id as string,
    displayName: (row.display_name as string) ?? '',
    minecraftUsername: (row.minecraft_username as string | null) ?? undefined,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    anthropicApiKey: (row.anthropic_api_key as string | null) ?? undefined,
    theme: (row.theme as Theme) ?? 'deepslate',
    preferences: {
      ...DEFAULT_USER_PREFERENCES,
      ...((row.preferences as Partial<UserPreferences> | null) ?? {}),
    },
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function useUserProfile() {
  const userId = useUserStore((s) => s.user?.id)
  const setStoreTheme = useUserStore((s) => s.setTheme)
  const setStoreProfile = useUserStore((s) => s.setProfile)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  const profileRef = useRef<UserProfile | null>(null)
  profileRef.current = profile

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', userId)
      .maybeSingle()

    if (err) {
      setError(err)
      setProfile(null)
    } else if (data) {
      setProfile(rowToProfile(data as Record<string, unknown>))
    }
    setLoading(false)
  }, [userId])

  const patch = useCallback(
    async (row: Record<string, unknown>, local: Partial<UserProfile>) => {
      if (!userId) return
      const now = new Date().toISOString()
      const { error: err } = await supabase
        .from('profiles')
        .update({ ...row, updated_at: now })
        .eq('auth_id', userId)
      if (err) {
        setError(err)
        throw err
      }
      setProfile((prev) => {
        if (!prev) return prev
        const next = { ...prev, ...local, updatedAt: now }
        // Keep the Zustand session user in sync so the sidebar avatar,
        // name, and theme dot update immediately on save.
        setStoreProfile(next)
        return next
      })
    },
    [userId, setStoreProfile],
  )

  const updateTheme = useCallback(
    async (theme: Theme): Promise<void> => {
      await patch({ theme }, { theme })
      setStoreTheme(theme)
    },
    [patch, setStoreTheme],
  )

  const updateDisplayName = useCallback(
    async (name: string): Promise<void> => {
      await patch({ display_name: name }, { displayName: name })
    },
    [patch],
  )

  const updateAvatar = useCallback(
    async (avatarUrl: string): Promise<void> => {
      await patch({ avatar_url: avatarUrl }, { avatarUrl })
    },
    [patch],
  )

  const updateApiKey = useCallback(
    async (apiKey: string | null): Promise<void> => {
      await patch(
        { anthropic_api_key: apiKey },
        { anthropicApiKey: apiKey ?? undefined },
      )
    },
    [patch],
  )

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>): Promise<void> => {
      const current = profileRef.current
      const nextPrefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        ...(current?.preferences ?? {}),
        ...prefs,
      }
      await patch({ preferences: nextPrefs }, { preferences: nextPrefs })
    },
    [patch],
  )

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    updateTheme,
    updateDisplayName,
    updateAvatar,
    updateApiKey,
    updatePreferences,
    refetch: fetchProfile,
  }
}
