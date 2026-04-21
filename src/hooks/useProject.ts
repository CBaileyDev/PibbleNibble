/**
 * hooks/useProject.ts
 *
 * Tracks the player's per-build project row. One project per
 * (user, build) pair; created lazily on first interaction.
 *
 * The project row stores:
 *   • status            — 'todo' | 'in-progress' | 'done' | 'completed'
 *   • current_step_id   — id of the step the player is on
 *   • completed_steps   — string[] of step ids already finished
 *
 * `completedSteps` is exposed as a `Set<string>` for cheap membership checks.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { BuildProject, ProjectStatus } from '@/types/project'

type Err = Error | null

/** DB row → BuildProject. */
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

export function useProject(buildId: string) {
  const userId = useUserStore((s) => s.user?.id)

  const [project, setProject] = useState<BuildProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  const projectRef = useRef<BuildProject | null>(null)
  projectRef.current = project

  /** Fetch-or-create the project row for this (user, build). */
  const fetchProject = useCallback(async () => {
    if (!buildId || !userId) {
      setProject(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .eq('build_id', buildId)
      .eq('user_id', userId)
      .maybeSingle()

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    if (data) {
      setProject(rowToProject(data as Record<string, unknown>))
      setLoading(false)
      return
    }

    // No existing row — lazily create one in 'todo' state.
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

    if (createErr) {
      setError(createErr)
      setLoading(false)
      return
    }
    setProject(rowToProject(created as Record<string, unknown>))
    setLoading(false)
  }, [buildId, userId])

  /** Patch the project row and locally mirror the change. */
  const patchProject = useCallback(
    async (patch: Record<string, unknown>, local: Partial<BuildProject>) => {
      const current = projectRef.current
      if (!current) return
      const now = new Date().toISOString()
      const { error: err } = await supabase
        .from('projects')
        .update({ ...patch, updated_at: now })
        .eq('id', current.id)
      if (err) {
        setError(err)
        throw err
      }
      setProject((prev) =>
        prev ? { ...prev, ...local, updatedAt: now } : prev,
      )
    },
    [],
  )

  const updateStatus = useCallback(
    async (status: ProjectStatus): Promise<void> => {
      await patchProject({ status }, { status })
    },
    [patchProject],
  )

  const updateCurrentStep = useCallback(
    async (stepId: string): Promise<void> => {
      await patchProject(
        { current_step_id: stepId },
        { currentStepId: stepId },
      )
    },
    [patchProject],
  )

  const toggleStepComplete = useCallback(
    async (stepId: string): Promise<void> => {
      const current = projectRef.current
      if (!current) return
      const has = current.completedSteps.includes(stepId)
      const nextSteps = has
        ? current.completedSteps.filter((s) => s !== stepId)
        : [...current.completedSteps, stepId]

      // Auto-bump status based on completion progress.
      let status: ProjectStatus | undefined
      if (nextSteps.length > 0 && current.status === 'todo') {
        status = 'in-progress'
      }

      await patchProject(
        status
          ? { completed_steps: nextSteps, status }
          : { completed_steps: nextSteps },
        status
          ? { completedSteps: nextSteps, status }
          : { completedSteps: nextSteps },
      )
    },
    [patchProject],
  )

  useEffect(() => {
    void fetchProject()

    if (!buildId || !userId) return
    const channel = supabase
      .channel(`project_${buildId}_${userId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `build_id=eq.${buildId}`,
        },
        () => {
          void fetchProject()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [buildId, userId, fetchProject])

  const completedSteps = useMemo(
    () => new Set(project?.completedSteps ?? []),
    [project?.completedSteps],
  )

  return {
    project,
    loading,
    error,
    completedSteps,
    updateStatus,
    updateCurrentStep,
    toggleStepComplete,
  }
}
