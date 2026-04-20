/**
 * hooks/useBuilds.ts
 *
 * TanStack Query hooks for the `builds` Supabase table.
 * All queries are scoped to the authenticated user via RLS —
 * no explicit userId filter is needed; Supabase handles it.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MinecraftBuild } from '@/types/build'

const QUERY_KEY = 'builds'

/** Fetch all builds for the current user, ordered by most recently updated. */
export function useBuilds() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as MinecraftBuild[]
    },
  })
}

/** Fetch a single build by ID. */
export function useBuild(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as MinecraftBuild
    },
    enabled: Boolean(id),
  })
}

/** Toggle a build's isFavorite flag. */
export function useToggleFavorite() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('builds')
        .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/** Save a new build (from AI generation or manual creation). */
export function useSaveBuild() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (build: Omit<MinecraftBuild, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('builds')
        .insert(build)
        .select()
        .single()

      if (error) throw error
      return data as MinecraftBuild
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/** Delete a build by ID. */
export function useDeleteBuild() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('builds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
