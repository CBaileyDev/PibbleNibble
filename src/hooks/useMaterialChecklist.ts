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
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MaterialItem } from '@/types/build'

type Err = Error | null

export function useMaterialChecklist(projectId: string) {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [collected, setCollected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  const collectedRef = useRef<string[]>([])
  collectedRef.current = collected

  const fetchChecklist = useCallback(async () => {
    if (!projectId) {
      setMaterials([])
      setCollected([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .select('build_id, collected_blocks')
      .eq('id', projectId)
      .maybeSingle()

    if (projectErr || !project) {
      setError(projectErr ?? new Error('Project not found'))
      setLoading(false)
      return
    }

    const { data: build, error: buildErr } = await supabase
      .from('builds')
      .select('materials')
      .eq('id', (project as { build_id: string }).build_id)
      .maybeSingle()

    if (buildErr || !build) {
      setError(buildErr ?? new Error('Build not found'))
      setLoading(false)
      return
    }

    setMaterials(
      ((build as { materials: MaterialItem[] | null }).materials ?? []) as MaterialItem[],
    )
    setCollected(
      ((project as { collected_blocks: string[] | null }).collected_blocks ?? []) as string[],
    )
    setLoading(false)
  }, [projectId])

  const writeCollected = useCallback(
    async (next: string[]) => {
      const prev = collectedRef.current
      setCollected(next)
      const { error: err } = await supabase
        .from('projects')
        .update({
          collected_blocks: next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
      if (err) {
        // Roll back optimistic update.
        setCollected(prev)
        setError(err)
        throw err
      }
    },
    [projectId],
  )

  const toggleCollected = useCallback(
    async (blockId: string): Promise<void> => {
      const current = collectedRef.current
      const next = current.includes(blockId)
        ? current.filter((id) => id !== blockId)
        : [...current, blockId]
      await writeCollected(next)
    },
    [writeCollected],
  )

  const resetAll = useCallback(async (): Promise<void> => {
    await writeCollected([])
  }, [writeCollected])

  useEffect(() => {
    void fetchChecklist()

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
          void fetchChecklist()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [projectId, fetchChecklist])

  const collectedSet = new Set(collected)
  const collectedCount = materials.reduce(
    (n, m) => (collectedSet.has(m.blockId) ? n + 1 : n),
    0,
  )
  const totalCount = materials.length

  return {
    materials,
    collectedBlocks: collected,
    toggleCollected,
    resetAll,
    collectedCount,
    totalCount,
    loading,
    error,
  }
}
