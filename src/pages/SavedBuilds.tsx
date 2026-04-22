/**
 * pages/SavedBuilds.tsx
 *
 * Library of every build the user has saved or started. Data comes
 * from the Supabase-backed `useBuilds()` hook (with realtime updates)
 * and is filtered, searched, and sorted client-side.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Wand2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { BuildCard, type BuildProject as CardProject } from '@/components/build/BuildCard'
import { BuildCardSkeleton, EmptyState as EmptyStateUI } from '@/components/ui/LoadingStates'
import { useBuilds } from '@/hooks/useBuilds'
import { useProjects } from '@/hooks/useProjects'
import type { MinecraftBuild } from '@/types/build'
import type { BuildProject } from '@/types/project'

/* ───────────────────────── filter / sort types ───────────────────────── */

type FilterTab = 'all' | 'saved' | 'in-progress' | 'completed'
type SortKey   = 'newest' | 'oldest' | 'name-asc' | 'difficulty'

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  easy:     1,
  medium:   2,
  hard:     3,
  expert:   4,
}

/** Total number of steps across all phases of a build — used for progress math. */
function totalStepCount(b: MinecraftBuild): number {
  return b.phases.reduce((n, p) => n + p.steps.length, 0)
}

/**
 * Shape the canonical BuildProject into the trimmed variant BuildCard
 * expects (it requires `progress`, ours has `completedSteps[]`).
 */
function toCardProject(project: BuildProject, build: MinecraftBuild): CardProject {
  const total = Math.max(totalStepCount(build), 1)
  const current = Math.min(project.completedSteps.length, total)
  return {
    id: project.id,
    buildId: project.buildId,
    name: project.name,
    status: project.status,
    progress: { current, total },
    currentStepText: project.currentStepText,
    updatedAt: project.updatedAt,
  }
}

/* ───────────────────────── page component ───────────────────────── */

const ROUTE_TABS: Record<string, FilterTab> = {
  '/my-builds':    'all',
  '/saved-builds': 'all',
  '/checklists':   'in-progress',
  '/saved':        'saved',
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/my-builds':    { title: 'My Builds',   subtitle: 'Every saved, in-progress, and completed build in one place.' },
  '/saved-builds': { title: 'My Builds',   subtitle: 'Every saved, in-progress, and completed build in one place.' },
  '/checklists':   { title: 'Checklists',  subtitle: 'Pick an in-progress build to jump back into its step checklist.' },
  '/saved':        { title: 'Saved',       subtitle: 'Builds you’ve bookmarked but haven’t started yet.' },
}

export function SavedBuilds() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { builds, loading, deleteBuild } = useBuilds()
  const { byBuildId: projectsByBuildId } = useProjects()

  const initialTab = ROUTE_TABS[pathname] ?? 'all'
  const pageCopy = ROUTE_TITLES[pathname] ?? ROUTE_TITLES['/my-builds']!

  const [tab, setTab]       = useState<FilterTab>(initialTab)
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [query, setQuery]   = useState('')

  // Re-sync the tab when the user navigates to another sidebar entry that
  // shares this component — without this, /saved and /checklists would keep
  // whatever tab was last selected.
  useEffect(() => {
    setTab(ROUTE_TABS[pathname] ?? 'all')
  }, [pathname])

  const counts = useMemo(() => {
    let saved = 0
    let inProgress = 0
    let completed = 0
    for (const b of builds) {
      const p = projectsByBuildId.get(b.id)
      if (!p) saved++
      else if (p.status === 'in-progress') inProgress++
      else if (p.status === 'done' || p.status === 'completed') completed++
    }
    return {
      all:           builds.length,
      saved,
      'in-progress': inProgress,
      completed,
    } satisfies Record<FilterTab, number>
  }, [builds, projectsByBuildId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filteredByTab = builds.filter((b) => {
      const p = projectsByBuildId.get(b.id)
      if (tab === 'all')         return true
      if (tab === 'saved')       return !p
      if (tab === 'in-progress') return p?.status === 'in-progress'
      if (tab === 'completed')   return p?.status === 'done' || p?.status === 'completed'
      return true
    })

    const searched = q
      ? filteredByTab.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q),
        )
      : filteredByTab

    const sorted = [...searched]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        case 'oldest':
          return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'difficulty':
          return (
            (DIFFICULTY_ORDER[a.difficulty] ?? 0) -
            (DIFFICULTY_ORDER[b.difficulty] ?? 0)
          )
        default:
          return 0
      }
    })

    return sorted
  }, [builds, tab, query, sortBy, projectsByBuildId])

  /* ───────── handlers ───────── */

  function handleGenerateNew() {
    navigate('/build-designer')
  }
  function handleView(buildId: string) {
    navigate(`/builds/${buildId}`)
  }
  function handleContinue(buildId: string) {
    navigate(`/builds/${buildId}`)
  }
  async function handleDelete(buildId: string) {
    try {
      await deleteBuild(buildId)
    } catch {
      /* error surfaced via hook state */
    }
  }

  /* ───────── render ───────── */

  return (
    <PageLayout
      title={pageCopy.title}
      subtitle={pageCopy.subtitle}
      headerActions={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleGenerateNew}
        >
          <Wand2 size={14} aria-hidden />
          Generate New
        </button>
      }
    >
      <div style={pageStyle}>
        <nav className="tabs" aria-label="Build status filter" style={tabsStyle}>
          <TabPill
            label="All"
            count={counts.all}
            active={tab === 'all'}
            onClick={() => setTab('all')}
          />
          <TabPill
            label="Saved"
            count={counts.saved}
            active={tab === 'saved'}
            onClick={() => setTab('saved')}
          />
          <TabPill
            label="In Progress"
            count={counts['in-progress']}
            active={tab === 'in-progress'}
            onClick={() => setTab('in-progress')}
          />
          <TabPill
            label="Completed"
            count={counts.completed}
            active={tab === 'completed'}
            onClick={() => setTab('completed')}
          />
        </nav>

        <div style={controlsRowStyle}>
          <label style={searchWrapStyle}>
            <span style={searchIconStyle} aria-hidden>
              <Search size={14} />
            </span>
            <input
              type="search"
              className="input"
              placeholder="Search builds..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 36 }}
              aria-label="Search builds"
            />
          </label>

          <label style={sortWrapStyle}>
            <span style={sortLabelStyle}>Sort</span>
            <select
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              style={sortSelectStyle}
              aria-label="Sort builds"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-asc">A–Z</option>
              <option value="difficulty">By Difficulty</option>
            </select>
          </label>
        </div>

        {loading && builds.length === 0 ? (
          <div style={gridStyle} aria-busy aria-label="Loading builds">
            {Array.from({ length: 6 }).map((_, i) => (
              <BuildCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            tab={tab}
            hasQuery={query.trim().length > 0}
            onGenerate={handleGenerateNew}
            onViewSaved={() => setTab('saved')}
            onClearSearch={() => setQuery('')}
          />
        ) : (
          <div style={gridStyle}>
            {filtered.map((build) => {
              const project = projectsByBuildId.get(build.id)
              const cardProject = project ? toCardProject(project, build) : undefined
              return (
                <BuildCard
                  key={build.id}
                  build={build}
                  project={cardProject}
                  onContinue={() => handleContinue(build.id)}
                  onView={() => handleView(build.id)}
                  onDelete={() => void handleDelete(build.id)}
                />
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

/* ───────────────────────── subcomponents ───────────────────────── */

function TabPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`tab${active ? ' active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          padding: '1px 7px',
          borderRadius: 'var(--r-pill)',
          background: active
            ? 'rgba(0,0,0,0.22)'
            : 'var(--bg-elevated)',
          color: active ? 'inherit' : 'var(--text-muted)',
          border: active ? '1px solid rgba(0,0,0,0.18)' : '1px solid var(--border)',
          lineHeight: 1.4,
          minWidth: 22,
          textAlign: 'center',
        }}
      >
        {count}
      </span>
    </button>
  )
}

function EmptyState({
  tab,
  hasQuery,
  onGenerate,
  onViewSaved,
  onClearSearch,
}: {
  tab: FilterTab
  hasQuery: boolean
  onGenerate: () => void
  onViewSaved: () => void
  onClearSearch: () => void
}) {
  if (hasQuery) {
    return (
      <EmptyStateUI
        icon="🔍"
        title="No builds match your search"
        subtitle="Try a different keyword, or clear the search to see everything in this tab."
        ctaLabel="Clear search"
        onCta={onClearSearch}
      />
    )
  }

  const copy = EMPTY_COPY[tab]
  const ctaLabel =
    copy.cta === 'generate' || copy.cta === 'viewSaved' ? copy.ctaLabel : undefined
  const onCta =
    copy.cta === 'generate'
      ? onGenerate
      : copy.cta === 'viewSaved'
        ? onViewSaved
        : undefined

  return (
    <EmptyStateUI
      icon={copy.glyph}
      title={copy.title}
      subtitle={copy.body}
      ctaLabel={ctaLabel}
      onCta={onCta}
    />
  )
}

const EMPTY_COPY: Record<
  FilterTab,
  {
    glyph: string
    title: string
    body?: string
    cta: 'generate' | 'viewSaved' | 'none'
    ctaLabel: string
  }
> = {
  all: {
    glyph: '⛏️',
    title: 'No builds yet',
    body: 'Let the AI dream something up — you can always save or remix the results.',
    cta: 'generate',
    ctaLabel: 'Generate your first build',
  },
  saved: {
    glyph: '🔖',
    title: 'Nothing saved — bookmark builds you want to try',
    body: 'When a generated build catches your eye, hit Save and it’ll land here.',
    cta: 'generate',
    ctaLabel: 'Generate new builds',
  },
  'in-progress': {
    glyph: '🛠️',
    title: 'No active projects — start a saved build',
    body: 'Pick any saved build and press Start Project to kick off step-by-step tracking.',
    cta: 'viewSaved',
    ctaLabel: 'Browse saved builds',
  },
  completed: {
    glyph: '🏆',
    title: 'Nothing complete yet — keep going!',
    body: 'Finish an active project to see it celebrated here.',
    cta: 'none',
    ctaLabel: '',
  },
}

/* ───────────────────────── styles ───────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
}

const tabsStyle: CSSProperties = {
  alignSelf: 'flex-start',
  flexWrap: 'wrap',
}

const controlsRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
}

const searchWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flex: '1 1 260px',
  minWidth: 220,
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  color: 'var(--text-muted)',
  display: 'inline-flex',
  pointerEvents: 'none',
}

const sortWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
}

const sortLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const sortSelectStyle: CSSProperties = {
  width: 'auto',
  minWidth: 160,
  padding: '8px 32px 8px 12px',
  fontSize: 13,
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 'var(--space-4)',
}
