/**
 * hooks/useProjects.ts
 *
 * Live list of every BuildProject owned by the current user. Backed by
 * TanStack Query; realtime INSERT/UPDATE/DELETE events on the
 * `projects` table invalidate the cache.
 *
 * Row layout: the `projects` table stores snake_case columns. This hook
 * converts to the camelCase BuildProject shape at the boundary.
 */

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useUserStore } from '@/stores/userStore'
import type { BuildProject, ProjectStatus } from '@/types/project'

function rowToProject(row: Record<string, unknown>): BuildProject {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    buildId: row.build_id as string,
    name: (row.name as string | null) ?? undefined,
    status: row.status as ProjectStatus,
    currentStepId: (row.current_step_id as string | null) ?? undefined,
    completedSteps: (row.completed_steps as string[] | null) ?? [],
    collectedBlocks: (row.collected_blocks as string[] | null) ?? [],
    currentStepText: (row.current_step_text as string | null) ?? undefined,
    startedAt: (row.started_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

async function fetchProjects(userId: string): Promise<BuildProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => rowToProject(r as Record<string, unknown>))
}

export function useProjects() {
  const userId = useUserStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const queryKey = qk.projects(userId)

  const query = useQuery<BuildProject[], Error>({
    queryKey,
    enabled: !!userId,
    queryFn: () => fetchProjects(userId as string),
  })

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`projects_${userId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
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

  const data = query.data

  /** Stable projects reference + buildId → project lookup. */
  const { projects, byBuildId } = useMemo(() => {
    const list = data ?? []
    const m = new Map<string, BuildProject>()
    for (const p of list) m.set(p.buildId, p)
    return { projects: list, byBuildId: m }
  }, [data])

  return {
    projects,
    byBuildId,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: async () => {
      await query.refetch()
    },
  }
}

/**
 * Sliced view — every project the user has marked complete, joined onto
 * the corresponding build. Same cache as `useProjects()` so nothing
 * re-fetches.
 */
export function useCompletedProjects() {
  const userId = useUserStore((s) => s.user?.id)

  const selectCompleted = useMemo(
    () => (data: BuildProject[]) =>
      data.filter((p) => p.status === 'done' || p.status === 'completed'),
    [],
  )

  const query = useQuery<BuildProject[], Error, BuildProject[]>({
    queryKey: qk.projects(userId),
    enabled: !!userId,
    queryFn: () => fetchProjects(userId as string),
    select: selectCompleted,
  })

  return {
    projects: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  }
}
