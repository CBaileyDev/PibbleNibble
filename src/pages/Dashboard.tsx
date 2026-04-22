/**
 * pages/Dashboard.tsx
 *
 * Main hub page for Pibble & Nibble. Data flows from the Supabase-backed
 * hooks: useBuilds (saved builds + realtime), useWorldNotes (coordinate
 * pins), and useUserProfile (theme / display name).
 *
 * Layout:
 *   PageLayout
 *   ├── Stats row (4 × StatCard)
 *   ├── QuickActionsBar
 *   └── Two-column main grid
 *       ├── Left  — ActiveProjectCard + Recent Builds grid
 *       └── Right — WorldNotesWidget + ActivityFeed
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Hammer,
  CheckCircle2,
  Layers,
  Flame,
} from 'lucide-react'

import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { DashboardSkeleton, EmptyState } from '@/components/ui/LoadingStates'
import { useTheme } from '@/hooks/useTheme'
import { useBuilds } from '@/hooks/useBuilds'
import { useProjects } from '@/hooks/useProjects'
import { useWorldNotes } from '@/hooks/useWorldNotes'

import { StatCard } from '@/components/dashboard/StatCard'
import { ActiveProjectCard } from '@/components/dashboard/ActiveProjectCard'
import { RecentBuildCard } from '@/components/dashboard/RecentBuildCard'
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar'
import { WorldNotesWidget } from '@/components/dashboard/WorldNotesWidget'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'

import type { MinecraftBuild } from '@/types/build'
import type { BuildProject } from '@/types/project'

function totalStepCount(b: MinecraftBuild): number {
  return b.phases.reduce((n, p) => n + p.steps.length, 0)
}


export function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  const { builds, loading: buildsLoading } = useBuilds()
  const { projects } = useProjects()
  const { notes } = useWorldNotes()

  /** Newest five builds (drives the Recent Builds grid & Activity feed). */
  const recentBuilds = useMemo(() => {
    return [...builds]
      .sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      )
      .slice(0, 3)
  }, [builds])

  /**
   * Prefer the user's most-recently-updated in-progress project. Falls back
   * to the newest build with no project row so the hero card still has
   * something to show for brand-new accounts.
   */
  const { activeBuild, activeProject } = useMemo<{
    activeBuild: MinecraftBuild | undefined
    activeProject: BuildProject | null
  }>(() => {
    const inProgress = projects
      .filter((p) => p.status === 'in-progress' || p.status === 'todo')
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    for (const p of inProgress) {
      const build = builds.find((b) => b.id === p.buildId)
      if (build) {
        const total = Math.max(totalStepCount(build), 1)
        const current = Math.min(p.completedSteps.length, total)
        return {
          activeBuild: build,
          activeProject: { ...p, progress: { current, total } },
        }
      }
    }
    const fallback = recentBuilds[0]
    return { activeBuild: fallback, activeProject: null }
  }, [projects, builds, recentBuilds])

  const activities: ActivityItem[] = useMemo(() => {
    return builds
      .slice(0, 8)
      .map((b) => ({
        id: `act-${b.id}`,
        message: `Saved ${b.name} to library`,
        timestamp: b.generatedAt,
        type: 'save' as const,
      }))
  }, [builds])

  const completedCount = useMemo(
    () =>
      projects.filter((p) => p.status === 'done' || p.status === 'completed')
        .length,
    [projects],
  )
  const activeCount = useMemo(
    () => projects.filter((p) => p.status === 'in-progress').length,
    [projects],
  )

  if (buildsLoading && builds.length === 0) {
    return (
      <PageLayout
        title="Workshop"
        subtitle={`${theme === 'blossom' ? '🌸 ' : '⚡ '}Loading your workshop…`}
      >
        <DashboardSkeleton />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Workshop"
      subtitle={`${theme === 'blossom' ? '🌸 ' : '⚡ '}${
        buildsLoading
          ? 'Loading your workshop…'
          : `You and Pibble have ${activeCount} active builds. Let's keep crafting.`
      }`}
      headerActions={
        <QuickActionsBar
          onGenerateBuild={() => navigate('/build-designer')}
          onViewBuilds={() => navigate('/my-builds')}
          onOpenChecklists={() => navigate('/checklists')}
        />
      }
    >
      {/* ── Stats row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
        }}
      >
        <StatCard
          icon={Hammer}
          value={activeCount}
          label="Active Builds"
        />
        <StatCard
          icon={CheckCircle2}
          value={completedCount}
          label="Completed"
        />
        <StatCard
          icon={Layers}
          value={builds.length}
          label="Saved Builds"
        />
        <StatCard
          icon={Flame}
          value={notes.length}
          label="World Notes"
        />
      </div>

      {/* ── Two-column main layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Active project */}
          <SectionCard
            title="Active Project"
            subtitle="Pick up where you left off"
          >
            {activeBuild && activeProject ? (
              <ActiveProjectCard
                project={activeProject}
                build={activeBuild}
                onContinue={() => navigate(`/builds/${activeBuild.id}`)}
              />
            ) : (
              <EmptyState
                icon="⛏️"
                title="No active builds yet"
                subtitle="Generate your first build and start stacking blocks."
                ctaLabel="Generate a build"
                onCta={() => navigate('/build-designer')}
              />
            )}
          </SectionCard>

          {/* Recent builds */}
          <SectionCard
            title="Fresh from the Forge"
            subtitle="Recently generated builds"
            headerAction={
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/my-builds')}
                style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}
              >
                See library →
              </button>
            }
          >
            {recentBuilds.length === 0 ? (
              <EmptyState
                icon="🔨"
                title="Nothing fresh yet"
                subtitle="Generate your first build to see it here."
                ctaLabel="Open Build Designer"
                onCta={() => navigate('/build-designer')}
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--space-4)',
                }}
              >
                {recentBuilds.map((build) => (
                  <RecentBuildCard
                    key={build.id}
                    build={build}
                    onStart={() => navigate(`/builds/${build.id}`)}
                    onSave={() => navigate('/my-builds')}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* World notes */}
          <SectionCard title="World Notes" subtitle="Coordinate pins">
            <WorldNotesWidget
              notes={notes}
              onAddNote={() => navigate('/world-notes')}
            />
          </SectionCard>

          {/* Activity feed */}
          <SectionCard title="Recent Activity">
            <ActivityFeed activities={activities} />
          </SectionCard>
        </div>
      </div>
    </PageLayout>
  )
}
