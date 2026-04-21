/**
 * hooks/useBuilds.ts
 *
 * Live view of every MinecraftBuild the user has saved. Fetches on
 * mount, subscribes to realtime changes on the `builds` table, and
 * exposes imperative save / delete helpers.
 *
 * Row layout: the `builds` table uses an explicit column list (see
 * supabase/migrations/0001_initial_schema.sql). We convert snake_case
 * columns to the canonical camelCase `MinecraftBuild` shape in a single
 * whitelist — both directions. No spread, no stray keys, no casts.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
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

type Err = Error | null

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
 * Main builds collection hook.
 *
 * Returns the user's builds along with imperative helpers. The list is
 * kept fresh by a realtime subscription on the `builds` table — any
 * INSERT / UPDATE / DELETE triggers a refetch.
 */
export function useBuilds() {
  const userId = useUserStore((s) => s.user?.id)

  const [builds, setBuilds] = useState<MinecraftBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)
  const refetchTimer = useRef<number | null>(null)

  const fetchSavedBuilds = useCallback(async (): Promise<MinecraftBuild[]> => {
    if (!userId) {
      setBuilds([])
      setLoading(false)
      return []
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('builds')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err)
      setLoading(false)
      throw err
    }

    const next = (data ?? []).map((r) => rowToBuild(r as BuildRow))
    setBuilds(next)
    setLoading(false)
    return next
  }, [userId])

  const saveBuild = useCallback(
    async (build: MinecraftBuild): Promise<void> => {
      if (!userId) throw new Error('Cannot save build: not authenticated')
      const row = buildToRow(build, userId)
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
    },
    [userId],
  )

  const deleteBuild = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('builds').delete().eq('id', id)
    if (err) {
      setError(err)
      throw err
    }
    setBuilds((prev) => prev.filter((b) => b.id !== id))
  }, [])

  useEffect(() => {
    let active = true
    const runFetch = () => {
      if (!active) return
      void fetchSavedBuilds().catch(() => undefined)
    }
    runFetch()

    if (!userId) return
    const channel = supabase
      .channel(`builds_${userId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'builds',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (!active) return
          if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
          refetchTimer.current = window.setTimeout(runFetch, 120)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'builds',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (!active) return
          if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
          refetchTimer.current = window.setTimeout(runFetch, 120)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'builds',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (!active) return
          if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
          refetchTimer.current = window.setTimeout(runFetch, 120)
        },
      )
      .subscribe()

    return () => {
      active = false
      if (refetchTimer.current) {
        window.clearTimeout(refetchTimer.current)
        refetchTimer.current = null
      }
      void supabase.removeChannel(channel)
    }
  }, [userId, fetchSavedBuilds])

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
 * needs one record by id. Shares the boundary logic with `useBuilds`.
 */
export function useBuild(id: string | undefined) {
  const userId = useUserStore((s) => s.user?.id)

  const [build, setBuild] = useState<MinecraftBuild | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)

  const refetch = useCallback(async () => {
    if (!id || !userId) {
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
      .eq('user_id', userId)
      .maybeSingle()

    if (err) {
      setError(err)
      setBuild(null)
    } else {
      setBuild(data ? rowToBuild(data as BuildRow) : null)
    }
    setLoading(false)
  }, [id, userId])

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
