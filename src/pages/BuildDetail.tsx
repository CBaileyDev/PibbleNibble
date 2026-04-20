/**
 * pages/BuildDetail.tsx
 *
 * Full detail view for a saved build. Shows the phase tab bar,
 * step-by-step checklist, material checklist, and the markdown
 * narrative instructions side-by-side.
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
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export function BuildDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: build, isLoading, error } = useBuild(id ?? '')
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)
  const qc = useQueryClient()

  if (isLoading) {
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

  const currentPhaseId = activePhaseId ?? build.phases[0]?.id ?? ''
  const activePhase = build.phases.find((p) => p.id === currentPhaseId)

  async function handleStepToggle(stepId: string, completed: boolean) {
    const updatedPhases = build!.phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) =>
        step.id === stepId ? { ...step, isCompleted: completed } : step
      ),
    }))

    await supabase
      .from('builds')
      .update({ phases: updatedPhases, updated_at: new Date().toISOString() })
      .eq('id', build!.id)

    void qc.invalidateQueries({ queryKey: ['builds', build!.id] })
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{build.title}</h2>
            <div className="flex gap-1.5 shrink-0">
              <Badge variant="default">{build.category}</Badge>
              <Badge variant="accent">{build.difficulty}</Badge>
              {build.isAiGenerated && <Badge variant="muted">AI</Badge>}
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
              phases={build.phases}
              activePhaseId={currentPhaseId}
              onSelect={setActivePhaseId}
            />
            <div className="flex flex-col gap-2 p-4">
              {activePhase?.steps.map((step) => (
                <StepCard key={step.id} step={step} onToggle={handleStepToggle} />
              ))}
            </div>
          </div>

          {/* Materials — 2 cols */}
          <SectionCard title="Materials" className="lg:col-span-2">
            <MaterialChecklist build={build} />
          </SectionCard>
        </div>

        {/* Full instructions */}
        <SectionCard title="Full Instructions">
          <BuildPreview markdown={build.markdownInstructions} />
        </SectionCard>
      </div>
    </PageLayout>
  )
}
