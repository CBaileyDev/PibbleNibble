/**
 * hooks/useUserProfile.ts
 *
 * TanStack Query hooks for the `profiles` Supabase table.
 * Used by Settings to read and update display name, theme, etc.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { UserProfile, Theme } from '@/types/user'

const QUERY_KEY = 'profile'

export function useUserProfile() {
  const userId = useUserStore((s) => s.user?.id)

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) throw error
      return data as UserProfile
    },
    enabled: Boolean(userId),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { user, setTheme } = useUserStore()

  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserProfile, 'displayName' | 'minecraftUsername' | 'theme'>>) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('auth_id', user?.id)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      if (variables.theme) {
        setTheme(variables.theme as Theme)
      }
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
