/**
 * hooks/useProject.ts
 *
 * TanStack Query hooks for the `project_tasks` table (kanban board).
 * Drag-and-drop reordering is handled client-side by @dnd-kit and
 * persisted via the `useUpdateTaskStatus` mutation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProjectTask, KanbanBoard, KanbanStatus } from '@/types/project'

const QUERY_KEY = 'project_tasks'

/** Returns all tasks for the user, grouped into a KanbanBoard. */
export function useKanbanBoard() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<KanbanBoard> => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .order('order', { ascending: true })

      if (error) throw error

      const tasks = data as ProjectTask[]
      return {
        todo: tasks.filter((t) => t.status === 'todo'),
        in_progress: tasks.filter((t) => t.status === 'in_progress'),
        done: tasks.filter((t) => t.status === 'done'),
      }
    },
  })
}

/** Move a task to a new column and update its order. */
export function useUpdateTaskStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      order,
    }: {
      id: string
      status: KanbanStatus
      order: number
    }) => {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status, order, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/** Create a new task card. */
export function useCreateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (task: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert(task)
        .select()
        .single()

      if (error) throw error
      return data as ProjectTask
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/** Delete a task by ID. */
export function useDeleteTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
