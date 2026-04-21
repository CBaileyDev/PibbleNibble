/**
 * hooks/useBuilds.ts
 *
 * Live view of every MinecraftBuild the user has saved. Backed by
 * TanStack Query for caching and deduping; realtime changes on the
 * `builds` table invalidate the cached query.
 *
 * Row layout: the `builds` table uses an explicit column list (see
 * supabase/migrations/0001_initial_schema.sql). We convert snake_case
 * columns to the canonical camelCase `MinecraftBuild` shape in a single
 * whitelist — both directions. No spread, no stray keys, no casts.
 */

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useUserStore } from '@/stores/userStore'
import type {
  Biome,
  BlockPalette,
  Difficulty,
  Dimensions,
  MaterialItem,
  MinecraftBuild,
  Phase,
  ProgressionLevel,
  Purpose,
  Theme,
  ValidationReport,
  VisualPreview,
} from '@/types/build'

// ─── Row shape (mirror of the builds table) ───────────────────────────────────

interface BuildRow {
  id: string
  user_id: string
  name: string
  description: string
  generated_at: string
  theme: Theme
  purpose: Purpose
  biome: Biome
  style_tags: string[]
  difficulty: Difficulty
  progression_level: ProgressionLevel
  estimated_minutes: number
  required_skills: string[]
  dimensions: Dimensions
  materials: MaterialItem[]
  block_palette: BlockPalette
  phases: Phase[]
  visual_preview: VisualPreview
  validation: ValidationReport | null
  created_at: string
  updated_at: string
}

function rowToBuild(row: BuildRow): MinecraftBuild {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    generatedAt: row.generated_at,
    theme: row.theme,
    purpose: row.purpose,
    biome: row.biome,
    styleTags: row.style_tags ?? [],
    difficulty: row.difficulty,
    progressionLevel: row.progression_level,
    estimatedMinutes: row.estimated_minutes,
    requiredSkills: row.required_skills ?? [],
    dimensions: row.dimensions,
    materials: row.materials ?? [],
    blockPalette: row.block_palette,
    phases: row.phases ?? [],
    visualPreview: row.visual_preview,
    validation: row.validation ?? null,
  }
}

/**
 * Build an upsert payload from a MinecraftBuild and the authenticated
 * user's id. Explicit whitelist — anything the AI or client adds that
 * isn't on this list is dropped before the row reaches Postgres.
 */
function buildToRow(build: MinecraftBuild, userId: string): Omit<BuildRow, 'created_at'> {
  return {
    id: build.id,
    user_id: userId,
    name: build.name,
    description: build.description,
    generated_at: build.generatedAt,
    theme: build.theme,
    purpose: build.purpose,
    biome: build.biome,
    style_tags: build.styleTags,
    difficulty: build.difficulty,
    progression_level: build.progressionLevel,
    estimated_minutes: build.estimatedMinutes,
    required_skills: build.requiredSkills,
    dimensions: build.dimensions,
    materials: build.materials,
    block_palette: build.blockPalette,
    phases: build.phases,
    visual_preview: build.visualPreview,
    validation: build.validation,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Fetch the full builds collection for a given user. Exported so the
 * sliced hooks (useRecentBuilds, useCompletedBuilds) share one cache.
 */
async function fetchBuilds(userId: string): Promise<MinecraftBuild[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => rowToBuild(r as BuildRow))
}

/**
 * Shared mutation helpers for saving and deleting builds. Both route
 * through the same `qk.builds(userId)` cache so pages that select
 * slices (recent, completed) observe the same source of truth.
 */
export function useSaveBuild() {
  const userId = useUserStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const queryKey = qk.builds(userId)

  return useMutation({
    mutationFn: async (build: MinecraftBuild) => {
      if (!userId) throw new Error('Cannot save build: not authenticated')
      const row = buildToRow(build, userId)
      const { error } = await supabase
        .from('builds')
        .upsert(row, { onConflict: 'id' })
      if (error) throw error
      return build
    },
    onSuccess: (build) => {
      queryClient.setQueryData<MinecraftBuild[]>(queryKey, (prev) => {
        if (!prev) return [build]
        const idx = prev.findIndex((b) => b.id === build.id)
        if (idx === -1) return [build, ...prev]
        const next = [...prev]
        next[idx] = build
        return next
      })
    },
  })
}

export function useDeleteBuild() {
  const userId = useUserStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const queryKey = qk.builds(userId)

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('builds').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<MinecraftBuild[]>(queryKey, (prev) =>
        (prev ?? []).filter((b) => b.id !== id),
      )
    },
  })
}

/**
 * Main builds collection hook. Returns the user's builds with cached
 * loading/error state and imperative save/delete helpers; the cache is
 * kept fresh by a realtime subscription on the `builds` table.
 */
export function useBuilds() {
  const userId = useUserStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const queryKey = qk.builds(userId)

  const query = useQuery<MinecraftBuild[], Error>({
    queryKey,
    enabled: !!userId,
    queryFn: () => fetchBuilds(userId as string),
  })

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`builds_${userId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'builds',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient, queryKey])

  const saveMutation = useSaveBuild()
  const deleteMutation = useDeleteBuild()

  return {
    builds: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    saveBuild: async (build: MinecraftBuild) => {
      await saveMutation.mutateAsync(build)
    },
    deleteBuild: async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
  }
}

/**
 * Sliced view — newest N builds. Shares the `qk.builds(userId)` cache
 * with `useBuilds()` so pages don't refetch when both are mounted.
 */
export function useRecentBuilds(limit = 3) {
  const userId = useUserStore((s) => s.user?.id)

  const selectRecent = useMemo(
    () => (data: MinecraftBuild[]) => {
      return [...data]
        .sort(
          (a, b) =>
            new Date(b.generatedAt).getTime() -
            new Date(a.generatedAt).getTime(),
        )
        .slice(0, limit)
    },
    [limit],
  )

  const query = useQuery<MinecraftBuild[], Error, MinecraftBuild[]>({
    queryKey: qk.builds(userId),
    enabled: !!userId,
    queryFn: () => fetchBuilds(userId as string),
    select: selectRecent,
  })

  return {
    builds: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  }
}

/**
 * Single-build fetcher — used by BuildDetail. Scoped to the authed user
 * for defense in depth over RLS.
 */
export function useBuild(id: string | undefined) {
  const userId = useUserStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const queryKey = qk.build(id, userId)

  const query = useQuery<MinecraftBuild | null, Error>({
    queryKey,
    enabled: !!id && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('builds')
        .select('*')
        .eq('id', id as string)
        .eq('user_id', userId as string)
        .maybeSingle()
      if (error) throw error
      return data ? rowToBuild(data as BuildRow) : null
    },
  })

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`build_${id}_realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'builds', filter: `id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, queryClient, queryKey])

  return {
    build: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: async () => {
      await query.refetch()
    },
  }
}
