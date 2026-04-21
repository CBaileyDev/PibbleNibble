/**
 * hooks/useWorldNotes.ts
 *
 * Realtime-subscribed list of world notes. Both players in a shared
 * world see each other's pins appear, move, and disappear live.
 *
 * DB columns are snake_case; the hook converts at the boundary. Backed
 * by TanStack Query so subsequent consumers share the same cache.
 */

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import type { WorldNote } from '@/types/project'

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

async function fetchNotes(): Promise<WorldNote[]> {
  const { data, error } = await supabase
    .from('world_notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => rowToNote(r as Record<string, unknown>))
}

export function useWorldNotes() {
  const queryClient = useQueryClient()
  const queryKey = qk.worldNotes()

  const query = useQuery<WorldNote[], Error>({
    queryKey,
    queryFn: fetchNotes,
  })

  const addMutation = useMutation({
    mutationFn: async (
      note: Omit<WorldNote, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
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
      const { data, error } = await supabase
        .from('world_notes')
        .insert(row)
        .select()
        .single()
      if (error) throw error
      return rowToNote(data as Record<string, unknown>)
    },
    onSuccess: (note) => {
      queryClient.setQueryData<WorldNote[]>(queryKey, (prev) =>
        prev ? [note, ...prev] : [note],
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('world_notes').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<WorldNote[]>(queryKey, (prev) =>
        (prev ?? []).filter((n) => n.id !== id),
      )
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('world_notes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'world_notes' },
        () => {
          void queryClient.invalidateQueries({ queryKey })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, queryKey])

  return {
    notes: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    addNote: async (note: Omit<WorldNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      await addMutation.mutateAsync(note)
    },
    deleteNote: async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
  }
}
