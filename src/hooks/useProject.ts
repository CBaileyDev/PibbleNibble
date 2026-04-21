/**
 * hooks/useProject.ts
 *
 * Tracks the player's per-build project row. One project per
 * (user, build) pair; created lazily on first fetch.
 *
 * The project row stores:
 *   • status            — 'todo' | 'in-progress' | 'done' | 'completed'
 *   • current_step_id   — id of the step the player is on
 *   • completed_steps   — string[] of step ids already finished
 *
 * `completedSteps` is exposed as a `Set<string>` for cheap membership checks.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

async function fetchOrCreateProject(
  buildId: string,
  userId: string,
): Promise<BuildProject> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('build_id', buildId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (data) return rowToProject(data as Record<string, unknown>)

  const now = new Date().toISOString()
  const { data: created, error: createErr } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      build_id: buildId,
      status: 'todo',
      completed_steps: [],
      collected_blocks: [],
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (createErr) throw createErr
  return rowToProject(created as Record<string, unknown>)
}

export function useProject(buildId: string) {
  const userId = useUserStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const queryKey = qk.project(buildId, userId)

  const query = useQuery<BuildProject | null, Error>({
    queryKey,
    enabled: !!buildId && !!userId,
    queryFn: () => fetchOrCreateProject(buildId, userId as string),
  })

  const project = query.data ?? null

  const patchMutation = useMutation({
    mutationFn: async ({
      patch,
      local,
    }: {
      patch: Record<string, unknown>
      local: Partial<BuildProject>
    }) => {
      if (!project) return null
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('projects')
        .update({ ...patch, updated_at: now })
        .eq('id', project.id)
      if (error) throw error
      return { ...project, ...local, updatedAt: now } satisfies BuildProject
    },
    onSuccess: (next) => {
      if (next) queryClient.setQueryData<BuildProject | null>(queryKey, next)
    },
  })

  const updateStatus = useCallback(
    async (status: ProjectStatus): Promise<void> => {
      await patchMutation.mutateAsync({ patch: { status }, local: { status } })
    },
    [patchMutation],
  )

  const updateCurrentStep = useCallback(
    async (stepId: string): Promise<void> => {
      await patchMutation.mutateAsync({
        patch: { current_step_id: stepId },
        local: { currentStepId: stepId },
      })
    },
    [patchMutation],
  )

  const toggleStepComplete = useCallback(
    async (stepId: string): Promise<void> => {
      if (!project) return
      const has = project.completedSteps.includes(stepId)
      const nextSteps = has
        ? project.completedSteps.filter((s) => s !== stepId)
        : [...project.completedSteps, stepId]

      // Auto-bump status on first step completion.
      const bump =
        nextSteps.length > 0 && project.status === 'todo'
          ? ({ status: 'in-progress' as ProjectStatus } as const)
          : null

      await patchMutation.mutateAsync({
        patch: bump
          ? { completed_steps: nextSteps, status: bump.status }
          : { completed_steps: nextSteps },
        local: bump
          ? { completedSteps: nextSteps, status: bump.status }
          : { completedSteps: nextSteps },
      })
    },
    [patchMutation, project],
  )

  useEffect(() => {
    if (!buildId || !userId) return
    const channel = supabase
      .channel(`project_${buildId}_${userId}_realtime`)
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
  }, [buildId, userId, queryClient, queryKey])

  const completedSteps = useMemo(
    () => new Set(project?.completedSteps ?? []),
    [project?.completedSteps],
  )

  return {
    project,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    completedSteps,
    updateStatus,
    updateCurrentStep,
    toggleStepComplete,
  }
}
