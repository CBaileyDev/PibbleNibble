/**
 * hooks/useWorldNotes.ts
 *
 * Realtime-subscribed list of world notes. Both players in a shared
 * world see each other's pins appear, move, and disappear live.
 *
 * DB columns are snake_case; the hook converts at the boundary.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { WorldNote } from '@/types/project'

type Err = Error | null

function rowToNote(row: Record<string, unknown>): WorldNote {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    label: row.label as string,
    description: (row.description as string | null) ?? undefined,
    x: Number(row.x),
    y: Number(row.y),
    z: Number(row.z),
    dimension: row.dimension as WorldNote['dimension'],
    pinColor: (row.pin_color as string) ?? '#6d83f2',
    buildId: (row.build_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  }
}

export function useWorldNotes() {
  const [notes, setNotes] = useState<WorldNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Err>(null)
  const refetchTimer = useRef<number | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('world_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err)
    } else {
      setNotes((data ?? []).map((r) => rowToNote(r as Record<string, unknown>)))
    }
    setLoading(false)
  }, [])

  const addNote = useCallback(
    async (note: Omit<WorldNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      const now = new Date().toISOString()
      const row = {
        user_id: note.userId,
        label: note.label,
        description: note.description ?? null,
        x: note.x,
        y: note.y,
        z: note.z,
        dimension: note.dimension,
        pin_color: note.pinColor,
        build_id: note.buildId ?? null,
        created_at: now,
        updated_at: now,
      }
      const { data, error: err } = await supabase
        .from('world_notes')
        .insert(row)
        .select()
        .single()

      if (err) {
        setError(err)
        throw err
      }
      if (data) {
        setNotes((prev) => [rowToNote(data as Record<string, unknown>), ...prev])
      }
    },
    [],
  )

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('world_notes').delete().eq('id', id)
    if (err) {
      setError(err)
      throw err
    }
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  useEffect(() => {
    let active = true
    const runFetch = () => {
      if (!active) return
      void fetchNotes()
    }
    runFetch()

    const channel = supabase
      .channel('world_notes_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'world_notes' },
        () => {
          if (!active) return
          if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
          refetchTimer.current = window.setTimeout(runFetch, 120)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'world_notes' },
        () => {
          if (!active) return
          if (refetchTimer.current) window.clearTimeout(refetchTimer.current)
          refetchTimer.current = window.setTimeout(runFetch, 120)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'world_notes' },
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
  }, [fetchNotes])

  return { notes, loading, error, addNote, deleteNote, fetchNotes }
}
