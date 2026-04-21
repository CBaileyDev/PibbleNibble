/**
 * hooks/useUserProfile.ts
 *
 * Reads and writes the authenticated user's profile row. Exposes
 * targeted mutators for theme, display name, and the preferences
 * JSONB column. The Zustand user store is kept in sync for theme
 * updates so the UI re-skins immediately.
 *
 * Backed by TanStack Query — the cached profile is shared across
 * pages that render the user's display name/theme.
 */

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useUserStore } from '@/stores/userStore'
import {
  DEFAULT_USER_PREFERENCES,
  type Theme,
  type UserPreferences,
  type UserProfile,
} from '@/types/user'

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    authId: row.auth_id as string,
    displayName: (row.display_name as string) ?? '',
    minecraftUsername: (row.minecraft_username as string | null) ?? undefined,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    theme: (row.theme as Theme) ?? 'deepslate',
    preferences: {
      ...DEFAULT_USER_PREFERENCES,
      ...((row.preferences as Partial<UserPreferences> | null) ?? {}),
    },
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? rowToProfile(data as Record<string, unknown>) : null
}

export function useUserProfile() {
  const userId = useUserStore((s) => s.user?.id)
  const setStoreTheme = useUserStore((s) => s.setTheme)
  const queryClient = useQueryClient()
  const queryKey = qk.userProfile(userId)

  const query = useQuery<UserProfile | null, Error>({
    queryKey,
    enabled: !!userId,
    queryFn: () => fetchProfile(userId as string),
  })

  const profile = query.data ?? null

  const patchMutation = useMutation({
    mutationFn: async ({
      row,
      local,
    }: {
      row: Record<string, unknown>
      local: Partial<UserProfile>
    }) => {
      if (!userId) throw new Error('Not authenticated')
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('profiles')
        .update({ ...row, updated_at: now })
        .eq('auth_id', userId)
      if (error) throw error
      return { local, updatedAt: now }
    },
    onSuccess: ({ local, updatedAt }) => {
      queryClient.setQueryData<UserProfile | null>(queryKey, (prev) =>
        prev ? { ...prev, ...local, updatedAt } : prev,
      )
    },
  })

  const updateTheme = useCallback(
    async (theme: Theme): Promise<void> => {
      await patchMutation.mutateAsync({ row: { theme }, local: { theme } })
      setStoreTheme(theme)
    },
    [patchMutation, setStoreTheme],
  )

  const updateDisplayName = useCallback(
    async (name: string): Promise<void> => {
      await patchMutation.mutateAsync({
        row: { display_name: name },
        local: { displayName: name },
      })
    },
    [patchMutation],
  )

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>): Promise<void> => {
      const nextPrefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        ...(profile?.preferences ?? {}),
        ...prefs,
      }
      await patchMutation.mutateAsync({
        row: { preferences: nextPrefs },
        local: { preferences: nextPrefs },
      })
    },
    [patchMutation, profile?.preferences],
  )

  return {
    profile,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    updateTheme,
    updateDisplayName,
    updatePreferences,
    refetch: async () => {
      await query.refetch()
    },
  }
}
