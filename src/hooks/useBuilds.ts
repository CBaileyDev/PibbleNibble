/**
 * hooks/useBuilds.ts
 *
 * Live view of every MinecraftBuild the user has saved. Fetches on
 * mount, subscribes to realtime changes on the `builds` table, and
 * exposes imperative save / delete helpers.
 *
 * Row layout: the `builds` table stores each build as a flattened row
 * with snake_case columns (user_id, created_at, updated_at, ...) plus
 * the structured payload. Timestamps and FK columns are converted at
 * the boundary so the rest of the app can stay in camelCase.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MinecraftBuild } from '@/types/build'

/** Anything non-data coming back from a Supabase failure. */
type Err = Error | null

/** Row → MinecraftBuild. Mostly identity, with snake_case → camelCase fix-ups. */
function rowToBuild(row: Record<string, unknown>): MinecraftBuild {
  const normalized = {
    ...row,
    userId: row.user_id ?? (row as { userId?: unknown }).userId,
    createdAt: row.created_at ?? (row as { createdAt?: unknown }).createdAt,
    updatedAt: row.updated_at ?? (row as { updatedAt?: unknown }).updatedAt,
    isFavorite: row.is_favorite ?? (row as { isFavorite?: unknown }).isFavorite,
    isAiGenerated:
      row.is_ai_generated ?? (row as { isAiGenerated?: unknown }).isAiGenerated,
  }
  return normalized as unknown as MinecraftBuild
}

/** MinecraftBuild → row. The reverse of `rowToBuild`. */
function buildToRow(build: MinecraftBuild): Record<string, unknown> {
  const b = build as unknown as Record<string, unknown>
  const row: Record<string, unknown> = { ...b }
  if ('userId' in b) row.user_id = b.userId
  if ('createdAt' in b) row.created_at = b.createdAt
  if ('updatedAt' in b) row.updated_at = b.updatedAt
  if ('isFavorite' in b) row.is_favorite = b.isFavorite
  if ('isAiGenerated' in b) row.is_ai_generated = b.isAiGenerated
  delete row.userId
  delete row.createdAt
  delete row.updatedAt
  delete row.isFavorite
  delete row.isAiGenerated
  return row
}

/**
 * Main builds collection hook.
 *
 * Returns the user's builds along with imperative helpers. The list is
 * kept fresh by a realtime subscription on the `builds` table — any
 * INSERT / UPDATE / DELETE triggers a refetch.
 */
export function useBuilds() {
  const [builds, setBuilds] = useState<MinecraftBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  /** We use a ref so the subscription callback always calls the latest fetcher. */
  const fetchRef = useRef<() => Promise<MinecraftBuild[]>>()

  const fetchSavedBuilds = useCallback(async (): Promise<MinecraftBuild[]> => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('builds')
      .select('*')
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err)
      setLoading(false)
      throw err
    }

    const next = (data ?? []).map((r) => rowToBuild(r as Record<string, unknown>))
    setBuilds(next)
    setLoading(false)
    return next
  }, [])

  fetchRef.current = fetchSavedBuilds

  const saveBuild = useCallback(async (build: MinecraftBuild): Promise<void> => {
    const row = buildToRow(build)
    row.updated_at = new Date().toISOString()
    const { error: err } = await supabase
      .from('builds')
      .upsert(row, { onConflict: 'id' })

    if (err) {
      setError(err)
      throw err
    }
    // Optimistic local merge — realtime will follow up.
    setBuilds((prev) => {
      const idx = prev.findIndex((b) => b.id === build.id)
      if (idx === -1) return [build, ...prev]
      const next = [...prev]
      next[idx] = build
      return next
    })
  }, [])

  const deleteBuild = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('builds').delete().eq('id', id)
    if (err) {
      setError(err)
      throw err
    }
    setBuilds((prev) => prev.filter((b) => b.id !== id))
  }, [])

  useEffect(() => {
    void fetchSavedBuilds().catch(() => {
      /* state already set */
    })

    const channel = supabase
      .channel('builds_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'builds' },
        () => {
          void fetchRef.current?.().catch(() => undefined)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchSavedBuilds])

  return {
    builds,
    loading,
    error,
    fetchSavedBuilds,
    saveBuild,
    deleteBuild,
  }
}

/**
 * Single-build fetcher — used by BuildDetail and anywhere else that
 * needs one record by id. Not part of the core spec but shares the
 * `builds` table boundary logic with `useBuilds`.
 */
export function useBuild(id: string | undefined) {
  const [build, setBuild] = useState<MinecraftBuild | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  const refetch = useCallback(async () => {
    if (!id) {
      setBuild(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('builds')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (err) {
      setError(err)
      setBuild(null)
    } else {
      setBuild(data ? rowToBuild(data as Record<string, unknown>) : null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void refetch()

    if (!id) return
    const channel = supabase
      .channel(`build_${id}_realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'builds', filter: `id=eq.${id}` },
        () => {
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, refetch])

  return { build, loading, error, refetch }
}
