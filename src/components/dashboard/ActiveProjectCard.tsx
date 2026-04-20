/**
 * components/dashboard/ActiveProjectCard.tsx
 *
 * Shows the most recent in-progress build with its material checklist
 * completion percentage and a "Continue" link. Shown prominently on
 * the Dashboard as the primary call-to-action.
 */

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BuildProgressBar } from '@/components/instructions/BuildProgressBar'
import { computeChecklistProgress } from '@/hooks/useMaterialChecklist'
import type { MinecraftBuild } from '@/types/build'

interface ActiveProjectCardProps {
  build: MinecraftBuild
}

export function ActiveProjectCard({ build }: ActiveProjectCardProps) {
  const materialProgress = computeChecklistProgress(build)

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">Active Build</span>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{build.title}</h3>
        </div>
        <div className="flex gap-1.5">
          <Badge variant="default">{build.category}</Badge>
          {build.isAiGenerated && <Badge variant="accent">AI</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">Build steps</span>
        </div>
        <BuildProgressBar build={build} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-[var(--text-muted)]">
          Materials gathered — {materialProgress}%
        </span>
        <div className="h-1.5 rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
            style={{ width: `${materialProgress}%` }}
          />
        </div>
      </div>

      <Link
        to={`/builds/${build.id}`}
        className="flex items-center justify-end gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors mt-auto"
      >
        Continue <ArrowRight size={14} />
      </Link>
    </Card>
  )
}
