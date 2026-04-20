/**
 * components/build/BuildResultCard.tsx
 *
 * Summary card shown on the Build Results page after AI generation.
 * Highlights title, dimensions, estimated time, and material count.
 * Provides "Save Build" and "Regenerate" actions.
 */

import { Clock, Box, Package } from 'lucide-react'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { BuildGenerationResponse } from '@/types/build'

interface BuildResultCardProps {
  result: BuildGenerationResponse
  onSave: () => void
  onRegenerate: () => void
  isSaving?: boolean
}

export function BuildResultCard({ result, onSave, onRegenerate, isSaving }: BuildResultCardProps) {
  const { build } = result
  const { width, height, depth } = build.dimensions

  return (
    <Card elevated>
      <CardBody className="flex flex-col gap-4">
        {/* Title + badges */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{build.title}</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{build.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="default">{build.category}</Badge>
            <Badge variant="accent">{build.difficulty}</Badge>
            <Badge variant="muted">{build.edition}</Badge>
            {build.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="muted">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatChip icon={<Box size={14} />} label="Size" value={`${width}×${height}×${depth}`} />
          <StatChip
            icon={<Clock size={14} />}
            label="Est. time"
            value={`${build.estimatedMinutes}m`}
          />
          <StatChip
            icon={<Package size={14} />}
            label="Materials"
            value={`${build.materials.length} types`}
          />
        </div>

        {/* Token usage */}
        <p className="text-xs text-[var(--text-muted)]">
          AI tokens used: {result.tokensUsed.toLocaleString()}
        </p>
      </CardBody>

      <CardFooter className="flex gap-2">
        <Button variant="secondary" onClick={onRegenerate} className="flex-1">
          Regenerate
        </Button>
        <Button onClick={onSave} isLoading={isSaving} className="flex-1">
          Save Build
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-3">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
