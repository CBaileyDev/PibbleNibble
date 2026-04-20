/**
 * components/instructions/MaterialChecklist.tsx
 *
 * Interactive shopping list for a build. Each row shows the material
 * name, Minecraft ID, and a number input for how many the player has
 * gathered. Progress persists to Supabase via useUpdateGathered.
 */

import { useState } from 'react'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useUpdateGathered, computeChecklistProgress } from '@/hooks/useMaterialChecklist'
import type { MinecraftBuild, MaterialItem } from '@/types/build'

interface MaterialChecklistProps {
  build: MinecraftBuild
}

export function MaterialChecklist({ build }: MaterialChecklistProps) {
  const [localMaterials, setLocalMaterials] = useState<MaterialItem[]>(build.materials)
  const { mutate: updateGathered, isPending } = useUpdateGathered()
  const progress = computeChecklistProgress({ ...build, materials: localMaterials })

  function handleGatheredChange(id: string, gathered: number) {
    setLocalMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, gathered: Math.min(gathered, m.quantity) } : m))
    )
  }

  function handleSave() {
    updateGathered(
      { buildId: build.id, materials: localMaterials },
      { onSuccess: () => toast.success('Checklist saved!') }
    )
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
        <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums w-10 text-right">
          {progress}%
        </span>
      </div>

      {/* Material rows */}
      <div className="flex flex-col gap-2">
        {localMaterials.map((material) => {
          const isComplete = material.gathered >= material.quantity
          return (
            <div
              key={material.id}
              className={[
                'flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-colors',
                isComplete
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] opacity-70'
                  : 'border-[var(--border)] bg-[var(--surface)]',
              ].join(' ')}
            >
              <Package size={14} className="shrink-0 text-[var(--text-muted)]" />

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isComplete ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                  {material.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] font-mono">{material.minecraftId}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={material.quantity}
                  value={material.gathered}
                  onChange={(e) => handleGatheredChange(material.id, Number(e.target.value))}
                  className="w-16 h-7 text-center text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
                <span className="text-xs text-[var(--text-muted)] tabular-nums">
                  / {material.quantity}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        onClick={handleSave}
        isLoading={isPending}
        variant="secondary"
        className="w-full mt-2"
      >
        Save Checklist
      </Button>
    </div>
  )
}
