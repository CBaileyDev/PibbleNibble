/**
 * pages/BuildDetail.tsx
 *
 * Full-screen step-by-step "quest log" for a single build.
 *
 * Layout: a fixed 38/62 split.
 *   - Left aside:  build overview + chunky progress bar + materials checklist.
 *   - Right section: phase tabs, scrollable step cards, and a sticky bottom nav.
 *
 * State management (Phase 6):
 *   - `currentStepId`        — one step at a time is "active".
 *   - `completedStepIds`     — Set<stepId> of everything ticked off.
 *   - `collectedBlockIds`    — Set<blockId> for the materials checklist.
 * All three persist to localStorage keyed by buildId so progress survives
 * refreshes. Supabase-backed persistence will replace this in Phase 7.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BuildProgressBar } from '@/components/instructions/BuildProgressBar'
import { PhaseTabBar } from '@/components/instructions/PhaseTabBar'
import { StepCard } from '@/components/instructions/StepCard'
import { MaterialChecklist } from '@/components/instructions/MaterialChecklist'
import { BottomNavBar } from '@/components/instructions/BottomNavBar'
import { getMockBuild } from '@/lib/mockBuildDetail'
import type { BuildStep, MinecraftBuild, Phase } from '@/types/build'

interface PersistedState {
  currentStepId: string | null
  completedStepIds: string[]
  collectedBlockIds: string[]
}

const STORAGE_PREFIX = 'pn:build-detail:'

function loadPersisted(buildId: string): PersistedState {
  if (typeof window === 'undefined') {
    return { currentStepId: null, completedStepIds: [], collectedBlockIds: [] }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + buildId)
    if (!raw) return { currentStepId: null, completedStepIds: [], collectedBlockIds: [] }
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      currentStepId: parsed.currentStepId ?? null,
      completedStepIds: Array.isArray(parsed.completedStepIds) ? parsed.completedStepIds : [],
      collectedBlockIds: Array.isArray(parsed.collectedBlockIds) ? parsed.collectedBlockIds : [],
    }
  } catch {
    return { currentStepId: null, completedStepIds: [], collectedBlockIds: [] }
  }
}

function flattenSteps(phases: Phase[]): BuildStep[] {
  return phases.flatMap((p) => p.steps)
}

function findPhaseIndex(phases: Phase[], stepId: string): number {
  for (let i = 0; i < phases.length; i++) {
    if (phases[i].steps.some((s) => s.stepId === stepId)) return i
  }
  return 0
}

export function BuildDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const build: MinecraftBuild = useMemo(() => getMockBuild(id), [id])
  const buildId = build.id

  const flatSteps = useMemo(() => flattenSteps(build.phases), [build.phases])

  // ── State ────────────────────────────────────────────────────────────────
  const [currentStepId, setCurrentStepId] = useState<string>(() => {
    const persisted = loadPersisted(buildId)
    if (persisted.currentStepId && flatSteps.some((s) => s.stepId === persisted.currentStepId)) {
      return persisted.currentStepId
    }
    return flatSteps[0]?.stepId ?? ''
  })

  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    () => new Set(loadPersisted(buildId).completedStepIds),
  )

  const [collectedBlockIds, setCollectedBlockIds] = useState<Set<string>>(
    () => new Set(loadPersisted(buildId).collectedBlockIds),
  )

  const [activePhase, setActivePhase] = useState<number>(() =>
    findPhaseIndex(build.phases, currentStepId),
  )

  // ── Persist on every change ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload: PersistedState = {
      currentStepId,
      completedStepIds: Array.from(completedStepIds),
      collectedBlockIds: Array.from(collectedBlockIds),
    }
    window.localStorage.setItem(STORAGE_PREFIX + buildId, JSON.stringify(payload))
  }, [buildId, currentStepId, completedStepIds, collectedBlockIds])

  // ── Sync active phase when the current step's phase changes ─────────────
  useEffect(() => {
    const idx = findPhaseIndex(build.phases, currentStepId)
    setActivePhase((prev) => (prev === idx ? prev : idx))
  }, [build.phases, currentStepId])

  // ── Auto-scroll to current step on mount & when it changes ──────────────
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const el = container.querySelector<HTMLElement>(
      `[data-step-id="${CSS.escape(currentStepId)}"]`,
    )
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStepId, activePhase])

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCompleteStep = useCallback(
    (stepId: string) => {
      setCompletedStepIds((prev) => {
        const next = new Set(prev)
        next.add(stepId)
        return next
      })
      const idx = flatSteps.findIndex((s) => s.stepId === stepId)
      const nextStep = flatSteps[idx + 1]
      if (nextStep) setCurrentStepId(nextStep.stepId)
    },
    [flatSteps],
  )

  const handlePrevious = useCallback(() => {
    const idx = flatSteps.findIndex((s) => s.stepId === currentStepId)
    const prev = flatSteps[idx - 1]
    if (prev) setCurrentStepId(prev.stepId)
  }, [flatSteps, currentStepId])

  const handleNext = useCallback(() => {
    const idx = flatSteps.findIndex((s) => s.stepId === currentStepId)
    const next = flatSteps[idx + 1]
    if (next) setCurrentStepId(next.stepId)
  }, [flatSteps, currentStepId])

  const handleExit = useCallback(() => {
    navigate('/saved-builds')
  }, [navigate])

  const handleToggleMaterial = useCallback((blockId: string) => {
    setCollectedBlockIds((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }, [])

  const handleMarkAllMaterials = useCallback(() => {
    setCollectedBlockIds(new Set(build.materials.map((m) => m.blockId)))
  }, [build.materials])

  // ── Derived ─────────────────────────────────────────────────────────────
  const completedStepsByPhase = useMemo(
    () =>
      build.phases.map(
        (p) => p.steps.filter((s) => completedStepIds.has(s.stepId)).length,
      ),
    [build.phases, completedStepIds],
  )

  const currentStepIndex = flatSteps.findIndex((s) => s.stepId === currentStepId)
  const totalSteps = flatSteps.length
  const completedCount = completedStepIds.size
  const currentPhaseName =
    build.phases[findPhaseIndex(build.phases, currentStepId)]?.phaseName ?? ''

  const activePhaseData = build.phases[activePhase]

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '38fr 62fr',
        height: '100dvh',
        minHeight: '100dvh',
        width: '100%',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <LeftPanel
        build={build}
        completedCount={completedCount}
        totalSteps={totalSteps}
        currentPhaseName={currentPhaseName}
        collectedBlockIds={collectedBlockIds}
        onToggleMaterial={handleToggleMaterial}
        onMarkAllMaterials={handleMarkAllMaterials}
        onBack={() => navigate('/saved-builds')}
      />

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          background: 'var(--bg-base)',
          position: 'relative',
          minWidth: 0,
        }}
      >
        <RightHeader build={build} />

        <PhaseTabBar
          phases={build.phases}
          activePhase={activePhase}
          onSelect={setActivePhase}
          completedStepsByPhase={completedStepsByPhase}
        />

        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 40px 120px',
          }}
        >
          {activePhaseData && (
            <PhaseIntro
              phase={activePhaseData}
              phaseIdx={activePhase}
              totalPhases={build.phases.length}
              completedSteps={completedStepsByPhase[activePhase] ?? 0}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activePhaseData?.steps.map((step) => {
              const state: 'upcoming' | 'current' | 'completed' =
                step.stepId === currentStepId
                  ? 'current'
                  : completedStepIds.has(step.stepId)
                    ? 'completed'
                    : 'upcoming'

              return (
                <StepCard
                  key={step.stepId}
                  step={step}
                  state={state}
                  onComplete={() => handleCompleteStep(step.stepId)}
                />
              )
            })}
          </div>
        </div>

        <BottomNavBar
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          canPrevious={currentStepIndex > 0}
          canNext={currentStepIndex < totalSteps - 1}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onExit={handleExit}
        />
      </section>
    </div>
  )
}

// ── Left panel ───────────────────────────────────────────────────────────

interface LeftPanelProps {
  build: MinecraftBuild
  completedCount: number
  totalSteps: number
  currentPhaseName: string
  collectedBlockIds: Set<string>
  onToggleMaterial: (blockId: string) => void
  onMarkAllMaterials: () => void
  onBack: () => void
}

function LeftPanel({
  build,
  completedCount,
  totalSteps,
  currentPhaseName,
  collectedBlockIds,
  onToggleMaterial,
  onMarkAllMaterials,
  onBack,
}: LeftPanelProps) {
  return (
    <aside
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        overflowY: 'auto',
        height: '100dvh',
      }}
    >
      {/* Breadcrumb */}
      <div style={{ padding: '24px 24px 0' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: 0,
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            cursor: 'pointer',
          }}
        >
          ← My Builds
        </button>
      </div>

      {/* Title block */}
      <div
        style={{
          padding: '18px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <PaletteGlyph colors={build.visualPreview.colorPalette} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
              }}
            >
              Build · {build.id.slice(0, 8).toUpperCase()}
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              {build.name}
            </h1>
          </div>
        </div>

        <TagRow build={build} />
      </div>

      {/* Progress */}
      <div
        style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}
      >
        <BuildProgressBar
          completed={completedCount}
          total={totalSteps}
          currentPhase={currentPhaseName}
        />
      </div>

      {/* Materials */}
      <div
        style={{
          padding: '14px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        <MaterialChecklist
          materials={build.materials}
          collectedBlockIds={collectedBlockIds}
          onToggle={onToggleMaterial}
          onMarkAll={onMarkAllMaterials}
        />
      </div>
    </aside>
  )
}

function PaletteGlyph({ colors }: { colors: string[] }) {
  const palette = colors.length > 0 ? colors : ['#8B6B3F', '#C49A5F', '#6A7A4E', '#3E6B22']
  return (
    <div
      aria-hidden
      style={{
        flexShrink: 0,
        width: 48,
        height: 48,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-sm)',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        padding: 4,
        gap: 3,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            background: palette[i % palette.length],
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.25)',
          }}
        />
      ))}
    </div>
  )
}

function TagRow({ build }: { build: MinecraftBuild }) {
  const { width, height, depth } = build.dimensions
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <Pill tone="var(--success)" filled>
        {build.difficulty}
      </Pill>
      <Pill>{build.progressionLevel} game</Pill>
      <Pill>{build.biome}</Pill>
      <Pill mono>
        {width} × {height} × {depth}
      </Pill>
    </div>
  )
}

function Pill({
  children,
  tone,
  filled,
  mono,
}: {
  children: React.ReactNode
  tone?: string
  filled?: boolean
  mono?: boolean
}) {
  const style = filled
    ? {
        background: `color-mix(in oklab, ${tone ?? 'var(--accent)'} 18%, transparent)`,
        border: `1px solid color-mix(in oklab, ${tone ?? 'var(--accent)'} 40%, transparent)`,
        color: tone ?? 'var(--accent)',
      }
    : {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: 11,
        fontWeight: filled ? 700 : 600,
        letterSpacing: '0.04em',
        textTransform: mono ? 'none' : 'capitalize',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ── Right header / phase intro ───────────────────────────────────────────

function RightHeader({ build }: { build: MinecraftBuild }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Quest Log
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          Step-by-Step
        </h2>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        ~{build.estimatedMinutes} min total
      </span>
    </div>
  )
}

function PhaseIntro({
  phase,
  phaseIdx,
  totalPhases,
  completedSteps,
}: {
  phase: Phase
  phaseIdx: number
  totalPhases: number
  completedSteps: number
}) {
  const remaining = phase.steps.length - completedSteps
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 18px',
        marginBottom: 20,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--r-sm)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Phase {phaseIdx + 1} of {totalPhases}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          {phase.phaseName}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            Progress
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>{completedSteps}</span> /{' '}
            {phase.steps.length} steps
          </span>
        </div>
        <span
          style={{
            padding: '5px 10px',
            background: 'var(--accent-subtle)',
            border: '1px solid rgba(0,204,255,0.25)',
            borderRadius: 'var(--r-xs)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {remaining} to go
        </span>
      </div>
    </div>
  )
}
