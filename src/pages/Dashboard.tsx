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

/** Read either the strict-schema `name` or the ambient `title` field. */
function readTitle(build: MinecraftBuild): string {
  const rec = build as unknown as Record<string, unknown>
  return (rec.name as string) ?? (rec.title as string) ?? 'Untitled Build'
}

/** Read either `updatedAt` (ambient) or `updated_at` (raw row) or fall back. */
function readUpdatedAt(build: MinecraftBuild): string {
  const rec = build as unknown as Record<string, unknown>
  return (
    (rec.updatedAt as string) ??
    (rec.updated_at as string) ??
    new Date().toISOString()
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  const { builds, loading: buildsLoading } = useBuilds()
  const { notes } = useWorldNotes()

  /** Newest five builds (drives the Recent Builds grid & Activity feed). */
  const recentBuilds = useMemo(() => {
    return [...builds]
      .sort(
        (a, b) => new Date(readUpdatedAt(b)).getTime() - new Date(readUpdatedAt(a)).getTime(),
      )
      .slice(0, 3)
  }, [builds])

  /**
   * Placeholder for the active project. A future iteration will pair
   * this with a `useProjects()` list hook — for now we surface the most
   * recent build as a proxy so the hero card has something to render.
   */
  const activeBuild: MinecraftBuild | undefined = recentBuilds[0]
  const activeProject: BuildProject | null = activeBuild
    ? {
        id: `draft-${activeBuild.id}`,
        userId: (activeBuild as unknown as { userId?: string }).userId ?? '',
        buildId: activeBuild.id,
        name: readTitle(activeBuild),
        status: 'in-progress',
        completedSteps: [],
        collectedBlocks: [],
        progress: { current: 0, total: 1 },
        createdAt: readUpdatedAt(activeBuild),
        updatedAt: readUpdatedAt(activeBuild),
      }
    : null

  const activities: ActivityItem[] = useMemo(() => {
    return builds
      .slice(0, 8)
      .map((b) => ({
        id: `act-${b.id}`,
        message: `Saved ${readTitle(b)} to library`,
        timestamp: readUpdatedAt(b),
        type: 'save' as const,
      }))
  }, [builds])

  const completedCount = useMemo(
    () =>
      builds.filter(
        (b) =>
          (b as unknown as { status?: string }).status === 'done' ||
          (b as unknown as { status?: string }).status === 'completed',
      ).length,
    [builds],
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
          : `You and Pibble have ${Math.max(builds.length - completedCount, 0)} active builds. Let's keep crafting.`
      }`}
      headerActions={
        <QuickActionsBar
          onGenerateBuild={() => navigate('/build-designer')}
          onViewBuilds={() => navigate('/saved-builds')}
          onOpenChecklists={() => navigate('/progress')}
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
          value={Math.max(builds.length - completedCount, 0)}
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
                onClick={() => navigate('/saved-builds')}
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
                    onSave={() => navigate('/saved-builds')}
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
