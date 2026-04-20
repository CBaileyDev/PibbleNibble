/**
 * hooks/useMaterialChecklist.ts
 *
 * Manages the gathered/total state of a build's material list.
 * Mutations persist back to the `builds` table (JSONB materials column)
 * so checklist progress survives page refreshes.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MaterialItem, MinecraftBuild } from '@/types/build'

/** Update how many of a given material the player has gathered. */
export function useUpdateGathered() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      buildId,
      materials,
    }: {
      buildId: string
      materials: MaterialItem[]
    }) => {
      const { error } = await supabase
        .from('builds')
        .update({ materials, updated_at: new Date().toISOString() })
        .eq('id', buildId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['builds', variables.buildId] })
    },
  })
}

/**
 * Derived helper: computes checklist progress percentage for a given build.
 * Returns a 0–100 number. Does not touch Supabase — pure computation.
 */
export function computeChecklistProgress(build: MinecraftBuild): number {
  const total = build.materials.reduce((sum, m) => sum + m.quantity, 0)
  const gathered = build.materials.reduce((sum, m) => sum + m.gathered, 0)
  return total === 0 ? 0 : Math.round((gathered / total) * 100)
}
