/**
 * pages/BuildDetail.tsx
 *
 * Full detail view for a saved build. The build itself is fetched by
 * `useBuild(id)`; per-player checklist state (current step, completed
 * steps) comes from `useProject(buildId)`.
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { Badge } from '@/components/ui/Badge'
import { BuildProgressBar } from '@/components/instructions/BuildProgressBar'
import { PhaseTabBar } from '@/components/instructions/PhaseTabBar'
import { StepCard } from '@/components/instructions/StepCard'
import { MaterialChecklist } from '@/components/instructions/MaterialChecklist'
import { BuildPreview } from '@/components/build/BuildPreview'
import { useBuild } from '@/hooks/useBuilds'
import { useProject } from '@/hooks/useProject'

/** Read either the strict-schema `name` or the ambient `title` field. */
function readTitle(b: unknown): string {
  const r = b as Record<string, unknown>
  return (r.name as string) ?? (r.title as string) ?? 'Untitled Build'
}

export function BuildDetail() {
  const { id } = useParams<{ id: string }>()
  const { build, loading, error } = useBuild(id)
  const { completedSteps, toggleStepComplete } = useProject(id ?? '')
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-[var(--surface)] rounded-[var(--radius-md)] w-1/2" />
          <div className="h-48 bg-[var(--surface)] rounded-[var(--radius-lg)]" />
        </div>
      </PageLayout>
    )
  }

  if (error || !build) {
    return (
      <PageLayout>
        <p className="text-center text-[var(--text-muted)] py-16">Build not found.</p>
      </PageLayout>
    )
  }

  const bundled = build as unknown as Record<string, unknown>
  const phases =
    (bundled.phases as Array<{ id?: string; phaseId?: number | string; steps?: Array<{ id?: string; stepId?: string }> }>) ??
    []

  const phaseIdOf = (p: { id?: string; phaseId?: number | string }): string =>
    (p.id as string) ?? String(p.phaseId ?? '')

  const currentPhaseId = activePhaseId ?? phaseIdOf(phases[0] ?? {})
  const activePhase = phases.find((p) => phaseIdOf(p) === currentPhaseId)

  async function handleStepToggle(stepId: string) {
    await toggleStepComplete(stepId)
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {readTitle(build)}
            </h2>
            <div className="flex gap-1.5 shrink-0">
              {bundled.category ? <Badge variant="default">{String(bundled.category)}</Badge> : null}
              {build.difficulty ? <Badge variant="accent">{build.difficulty}</Badge> : null}
              {bundled.isAiGenerated ? <Badge variant="muted">AI</Badge> : null}
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{build.description}</p>
          <BuildProgressBar build={build} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Steps — 3 cols */}
          <div className="lg:col-span-3 flex flex-col gap-0 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
            <PhaseTabBar
              phases={phases as never}
              activePhaseId={currentPhaseId}
              onSelect={setActivePhaseId}
            />
            <div className="flex flex-col gap-2 p-4">
              {activePhase?.steps?.map((step) => {
                const stepId = (step.id as string) ?? (step.stepId as string)
                return (
                  <StepCard
                    key={stepId}
                    step={{
                      ...(step as Record<string, unknown>),
                      id: stepId,
                      isCompleted: completedSteps.has(stepId),
                    } as never}
                    onToggle={(sid: string) => void handleStepToggle(sid)}
                  />
                )
              })}
            </div>
          </div>

          {/* Materials — 2 cols */}
          <SectionCard title="Materials" className="lg:col-span-2">
            <MaterialChecklist build={build} />
          </SectionCard>
        </div>

        {/* Full instructions */}
        {typeof bundled.markdownInstructions === 'string' && (
          <SectionCard title="Full Instructions">
            <BuildPreview markdown={bundled.markdownInstructions as string} />
          </SectionCard>
        )}
      </div>
    </PageLayout>
  )
}
