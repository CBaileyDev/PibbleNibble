/**
 * components/instructions/MaterialChecklist.tsx
 *
 * Interactive shopping list for a build. Each row is a checkbox tied
 * to a unique blockId — toggling it calls `toggleCollected` on the
 * `useMaterialChecklist(projectId)` hook and persists to Supabase.
 */

import { useMemo } from 'react'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useMaterialChecklist } from '@/hooks/useMaterialChecklist'
import { useProject } from '@/hooks/useProject'
import type { MinecraftBuild, MaterialItem } from '@/types/build'

interface MaterialChecklistProps {
  build: MinecraftBuild
}

export function MaterialChecklist({ build }: MaterialChecklistProps) {
  // The project hook resolves (or creates) the per-user project row for
  // this build. We need its id to drive the checklist hook.
  const { project } = useProject(build.id)
  const projectId = project?.id ?? ''

  const {
    materials: persistedMaterials,
    collectedBlocks,
    toggleCollected,
    resetAll,
    collectedCount,
    totalCount,
    loading,
  } = useMaterialChecklist(projectId)

  // Prefer the build-embedded materials if the project/materials haven't
  // resolved yet — keeps the list visible during first paint.
  const materials: MaterialItem[] = persistedMaterials.length
    ? persistedMaterials
    : build.materials ?? []

  const collectedSet = useMemo(() => new Set(collectedBlocks), [collectedBlocks])

  const total = totalCount || materials.length
  const progress = total === 0 ? 0 : Math.round((collectedCount / total) * 100)

  async function handleToggle(blockId: string) {
    if (!projectId) return
    try {
      await toggleCollected(blockId)
    } catch {
      toast.error('Failed to update checklist')
    }
  }

  async function handleReset() {
    try {
      await resetAll()
      toast.success('Checklist reset')
    } catch {
      toast.error('Failed to reset checklist')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress summary */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums w-20 text-right">
          {collectedCount}/{total}
        </span>
      </div>

      {/* Material rows */}
      <div className="flex flex-col gap-2">
        {materials.map((material) => {
          const isComplete = collectedSet.has(material.blockId)
          return (
            <label
              key={material.blockId}
              className={[
                'flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-colors cursor-pointer',
                isComplete
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] opacity-70'
                  : 'border-[var(--border)] bg-[var(--surface)]',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={isComplete}
                disabled={loading || !projectId}
                onChange={() => void handleToggle(material.blockId)}
                className="shrink-0"
              />
              <Package size={14} className="shrink-0 text-[var(--text-muted)]" />

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isComplete
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {material.blockName}
                </p>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {material.blockId}
                </p>
              </div>

              <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
                × {material.quantity}
              </span>
            </label>
          )
        })}
      </div>

      <Button
        onClick={() => void handleReset()}
        variant="secondary"
        className="w-full mt-2"
        disabled={collectedCount === 0}
      >
        Reset Checklist
      </Button>
    </div>
  )
}
