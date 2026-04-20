/**
 * hooks/useWorldNotes.ts
 *
 * TanStack Query hooks for the `world_notes` table — coordinate pins
 * and location annotations players drop on the world map.
 *
 * Supabase Realtime is subscribed here so both users see new pins
 * appear instantly without polling.
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorldNote } from '@/types/project'

const QUERY_KEY = 'world_notes'

export function useWorldNotes() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('world_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as WorldNote[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('world_notes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'world_notes' }, () => {
        void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [qc])

  return query
}

export function useCreateWorldNote() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (note: Omit<WorldNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('world_notes')
        .insert(note)
        .select()
        .single()

      if (error) throw error
      return data as WorldNote
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteWorldNote() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('world_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
