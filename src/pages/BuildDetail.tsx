/**
 * pages/BuildDetail.tsx
 *
 * Full detail view for a saved build. The build itself is fetched by
 * `useBuild(id)`; per-player checklist state (current step, completed
 * steps) comes from `useProject(buildId)`.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { Badge } from '@/components/ui/Badge'
import { BuildProgressBar } from '@/components/instructions/BuildProgressBar'
import { PhaseTabBar } from '@/components/instructions/PhaseTabBar'
import { StepCard } from '@/components/instructions/StepCard'
import { MaterialChecklist } from '@/components/instructions/MaterialChecklist'
import { EmptyState, InstructionsSkeleton } from '@/components/ui/LoadingStates'
import { useBuild } from '@/hooks/useBuilds'
import { useProject } from '@/hooks/useProject'

export function BuildDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { build, loading, error } = useBuild(id)
  const { completedSteps, toggleStepComplete } = useProject(id ?? '')
  const [activePhaseId, setActivePhaseId] = useState<number | null>(null)

  // Resolve the phase to render. Defaults to the first phase; falls back
  // to the first if the stored active id is no longer in the list.
  const activePhase = useMemo(() => {
    if (!build || build.phases.length === 0) return undefined
    const resolved =
      build.phases.find((p) => p.phaseId === activePhaseId) ?? build.phases[0]
    return resolved
  }, [build, activePhaseId])

  if (loading) {
    return (
      <PageLayout>
        <InstructionsSkeleton />
      </PageLayout>
    )
  }

  if (error || !build) {
    return (
      <PageLayout>
        <EmptyState
          icon="🧭"
          title="Build not found"
          subtitle="This build may have been deleted, or the link might be out of date."
          ctaLabel="Browse saved builds"
          onCta={() => navigate('/saved-builds')}
          secondaryLabel="Generate a new one"
          onSecondary={() => navigate('/build-designer')}
        />
      </PageLayout>
    )
  }

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
              {build.name}
            </h2>
            <div className="flex gap-1.5 shrink-0">
              {build.purpose ? <Badge variant="default">{build.purpose}</Badge> : null}
              {build.difficulty ? <Badge variant="accent">{build.difficulty}</Badge> : null}
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{build.description}</p>
          <BuildProgressBar build={build} completedStepIds={completedSteps} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Steps — 3 cols */}
          <div className="lg:col-span-3 flex flex-col gap-0 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
            <PhaseTabBar
              phases={build.phases}
              activePhaseId={activePhase?.phaseId ?? build.phases[0].phaseId}
              completedStepIds={completedSteps}
              onSelect={setActivePhaseId}
            />
            <div className="flex flex-col gap-2 p-4">
              {activePhase?.steps.map((step) => (
                <StepCard
                  key={step.stepId}
                  step={step}
                  isCompleted={completedSteps.has(step.stepId)}
                  onToggle={(sid) => void handleStepToggle(sid)}
                />
              ))}
            </div>
          </div>

          {/* Materials — 2 cols */}
          <SectionCard title="Materials" className="lg:col-span-2">
            <MaterialChecklist build={build} />
          </SectionCard>
        </div>
      </div>
    </PageLayout>
  )
}
