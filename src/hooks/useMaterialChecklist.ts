/**
 * hooks/useMaterialChecklist.ts
 *
 * Per-project material checklist. Given a projectId, loads the linked
 * build's material list plus the project's `collected_blocks` array
 * and exposes:
 *
 *   • materials         — the build's bill of materials
 *   • toggleCollected() — flip a block's collected flag (blockId is unique)
 *   • resetAll()        — clear every collected block
 *   • collectedCount    — materials the player has finished gathering
 *   • totalCount        — total distinct materials in the bill
 *
 * Backed by TanStack Query with an optimistic mutation for toggle/reset.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import type { MaterialItem } from '@/types/build'

interface ChecklistData {
  materials: MaterialItem[]
  collected: string[]
}

async function fetchChecklist(projectId: string): Promise<ChecklistData> {
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('build_id, collected_blocks')
    .eq('id', projectId)
    .maybeSingle()

  if (projectErr) throw projectErr
  if (!project) throw new Error('Project not found')

  const { data: build, error: buildErr } = await supabase
    .from('builds')
    .select('materials')
    .eq('id', (project as { build_id: string }).build_id)
    .maybeSingle()

  if (buildErr) throw buildErr
  if (!build) throw new Error('Build not found')

  return {
    materials:
      ((build as { materials: MaterialItem[] | null }).materials ?? []) as MaterialItem[],
    collected:
      ((project as { collected_blocks: string[] | null }).collected_blocks ?? []) as string[],
  }
}

export function useMaterialChecklist(projectId: string) {
  const queryClient = useQueryClient()
  const queryKey = qk.materialChecklist(projectId)

  const query = useQuery<ChecklistData, Error>({
    queryKey,
    enabled: !!projectId,
    queryFn: () => fetchChecklist(projectId),
  })

  const writeMutation = useMutation<
    string[],
    Error,
    string[],
    { previous: ChecklistData | undefined }
  >({
    mutationFn: async (next: string[]) => {
      const { error } = await supabase
        .from('projects')
        .update({
          collected_blocks: next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
      if (error) throw error
      return next
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ChecklistData>(queryKey)
      if (previous) {
        queryClient.setQueryData<ChecklistData>(queryKey, {
          ...previous,
          collected: next,
        })
      }
      return { previous }
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous)
    },
  })

  const current = query.data

  const toggleCollected = useCallback(
    async (blockId: string): Promise<void> => {
      const collected = current?.collected ?? []
      const next = collected.includes(blockId)
        ? collected.filter((id) => id !== blockId)
        : [...collected, blockId]
      await writeMutation.mutateAsync(next)
    },
    [current?.collected, writeMutation],
  )

  const resetAll = useCallback(async (): Promise<void> => {
    await writeMutation.mutateAsync([])
  }, [writeMutation])

  useEffect(() => {
    if (!projectId) return
    const channel = supabase
      .channel(`checklist_${projectId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [projectId, queryClient, queryKey])

  const materials = current?.materials
  const collected = current?.collected

  const { collectedCount, totalCount, materialsOut, collectedOut } = useMemo(() => {
    const mats = materials ?? []
    const col = collected ?? []
    const set = new Set(col)
    return {
      collectedCount: mats.reduce(
        (n, m) => (set.has(m.blockId) ? n + 1 : n),
        0,
      ),
      totalCount: mats.length,
      materialsOut: mats,
      collectedOut: col,
    }
  }, [materials, collected])

  return {
    materials: materialsOut,
    collectedBlocks: collectedOut,
    toggleCollected,
    resetAll,
    collectedCount,
    totalCount,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  }
}
