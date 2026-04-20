/**
 * pages/Dashboard.tsx
 *
 * Home screen. Shows KPI stats, the active build, quick actions,
 * the world notes widget, and the recent activity feed.
 */

import { BookOpen, Wand2, CheckSquare, MapPin } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { ActiveProjectCard } from '@/components/dashboard/ActiveProjectCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { WorldNotesWidget } from '@/components/dashboard/WorldNotesWidget'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useBuilds } from '@/hooks/useBuilds'
import { useWorldNotes } from '@/hooks/useWorldNotes'
import { useUserStore } from '@/stores/userStore'

export function Dashboard() {
  const user = useUserStore((s) => s.user)
  const { data: builds = [] } = useBuilds()
  const { data: notes = [] } = useWorldNotes()

  const activeBuild = builds.find((b) => {
    const allSteps = b.phases.flatMap((p) => p.steps)
    return allSteps.length > 0 && allSteps.some((s) => !s.isCompleted)
  })

  const completedBuilds = builds.filter((b) =>
    b.phases.flatMap((p) => p.steps).every((s) => s.isCompleted)
  )

  return (
    <PageLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Hey, {user?.profile.displayName ?? 'builder'} 👋
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Ready to build something amazing?
          </p>
        </div>

        {/* Quick actions */}
        <QuickActions />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Builds"     value={builds.length}           icon={<BookOpen size={16} />} />
          <StatCard label="AI Generated"     value={builds.filter((b) => b.isAiGenerated).length} icon={<Wand2 size={16} />} />
          <StatCard label="Completed"        value={completedBuilds.length}  icon={<CheckSquare size={16} />} />
          <StatCard label="World Notes"      value={notes.length}            icon={<MapPin size={16} />} />
        </div>

        {/* Main two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Active build — spans 2 columns */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {activeBuild ? (
              <ActiveProjectCard build={activeBuild} />
            ) : (
              <SectionCard title="Active Build">
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  No build in progress. Start one in the Build Designer!
                </p>
              </SectionCard>
            )}

            <SectionCard title="Recent Activity">
              <ActivityFeed />
            </SectionCard>
          </div>

          {/* World notes sidebar */}
          <SectionCard title="World Notes">
            <WorldNotesWidget />
          </SectionCard>
        </div>
      </div>
    </PageLayout>
  )
}
