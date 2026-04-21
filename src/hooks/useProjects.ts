/**
 * hooks/useProjects.ts
 *
 * Live list of every BuildProject owned by the current user. Fetches
 * on mount, subscribes to realtime changes on the `projects` table
 * (scoped to this user), and exposes a `byBuildId` lookup map so pages
 * can resolve a build's status without a secondary round-trip.
 *
 * Row layout: the `projects` table stores snake_case columns. This hook
 * converts to the camelCase BuildProject shape at the boundary.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { BuildProject, ProjectStatus } from '@/types/project'

type Err = Error | null

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

export function useProjects() {
  const userId = useUserStore((s) => s.user?.id)

  const [projects, setProjects] = useState<BuildProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  const fetchProjects = useCallback(async () => {
    if (!userId) {
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    setProjects((data ?? []).map((r) => rowToProject(r as Record<string, unknown>)))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void fetchProjects()

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
          void fetchProjects()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, fetchProjects])

  /** buildId → project lookup, memoized so consumers can map in O(1). */
  const byBuildId = useMemo(() => {
    const m = new Map<string, BuildProject>()
    for (const p of projects) m.set(p.buildId, p)
    return m
  }, [projects])

  return { projects, byBuildId, loading, error, refetch: fetchProjects }
}
