/**
 * pages/SavedBuilds.tsx
 *
 * Library of every build the user has saved or started. Data comes
 * from the Supabase-backed `useBuilds()` hook (with realtime updates)
 * and is filtered, searched, and sorted client-side.
 */

import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wand2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { BuildCard, type BuildProject } from '@/components/build/BuildCard'
import { useBuilds } from '@/hooks/useBuilds'
import type { MinecraftBuild } from '@/types/build'

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

/** Tolerant helpers — the DB row might carry either the strict schema's
 *  `name` or the ambient `title`. Same for timestamp casing. */
function readTitle(b: MinecraftBuild): string {
  const r = b as unknown as Record<string, unknown>
  return (r.name as string) ?? (r.title as string) ?? 'Untitled Build'
}
function readUpdatedAt(b: MinecraftBuild): string {
  const r = b as unknown as Record<string, unknown>
  return (r.updatedAt as string) ?? (r.updated_at as string) ?? ''
}
function readDescription(b: MinecraftBuild): string {
  const r = b as unknown as Record<string, unknown>
  return (r.description as string) ?? ''
}

/** Read the linked project, if the DB has bundled it onto the row. */
function readProject(b: MinecraftBuild): BuildProject | undefined {
  const r = b as unknown as Record<string, unknown>
  const p = (r.project as BuildProject | undefined) ?? undefined
  if (p && typeof p.status === 'string') return p
  // Some rows carry a flat `status` field — promote it to a synthetic project.
  if (typeof r.status === 'string' && r.status !== 'saved') {
    return {
      id: `synthetic-${b.id}`,
      buildId: b.id,
      status: r.status as BuildProject['status'],
      progress: (r.progress as { current: number; total: number } | undefined) ??
        { current: 0, total: 1 },
      currentStepText: (r.currentStepText as string | undefined),
      updatedAt: readUpdatedAt(b),
    }
  }
  return undefined
}

/* ───────────────────────── page component ───────────────────────── */

export function SavedBuilds() {
  const navigate = useNavigate()
  const { builds, loading, deleteBuild } = useBuilds()

  const [tab, setTab]       = useState<FilterTab>('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [query, setQuery]   = useState('')
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({})

  const counts = useMemo(() => {
    let saved = 0
    let inProgress = 0
    let completed = 0
    for (const b of builds) {
      const p = readProject(b)
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
  }, [builds])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filteredByTab = builds.filter((b) => {
      const p = readProject(b)
      if (tab === 'all')         return true
      if (tab === 'saved')       return !p
      if (tab === 'in-progress') return p?.status === 'in-progress'
      if (tab === 'completed')   return p?.status === 'done' || p?.status === 'completed'
      return true
    })

    const searched = q
      ? filteredByTab.filter(
          (b) =>
            readTitle(b).toLowerCase().includes(q) ||
            readDescription(b).toLowerCase().includes(q),
        )
      : filteredByTab

    const sorted = [...searched]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(readUpdatedAt(b)).getTime() - new Date(readUpdatedAt(a)).getTime()
        case 'oldest':
          return new Date(readUpdatedAt(a)).getTime() - new Date(readUpdatedAt(b)).getTime()
        case 'name-asc':
          return readTitle(a).localeCompare(readTitle(b))
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
  }, [builds, tab, query, sortBy])

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
  function handleSave(buildId: string) {
    setSavedFlags((prev) => ({ ...prev, [buildId]: !prev[buildId] }))
  }

  /* ───────── render ───────── */

  return (
    <PageLayout
      title="My Builds"
      subtitle="Every saved, in-progress, and completed build in one place."
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
          <div style={emptyStyle}>
            <span style={emptyGlyphStyle} aria-hidden>⏳</span>
            <h2 style={emptyTitleStyle}>Loading your builds…</h2>
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
              const project = readProject(build)
              return (
                <BuildCard
                  key={build.id + (savedFlags[build.id] ? '-saved' : '')}
                  build={build}
                  project={project}
                  onContinue={() => handleContinue(build.id)}
                  onView={() => handleView(build.id)}
                  onDelete={() => void handleDelete(build.id)}
                  onSave={project ? undefined : () => handleSave(build.id)}
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
      <div style={emptyStyle}>
        <span style={emptyGlyphStyle} aria-hidden>🔍</span>
        <h2 style={emptyTitleStyle}>No builds match your search</h2>
        <p style={emptyBodyStyle}>
          Try a different keyword, or clear the search to see everything in this tab.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClearSearch}>
          Clear search
        </button>
      </div>
    )
  }

  const copy = EMPTY_COPY[tab]

  return (
    <div style={emptyStyle}>
      <span style={emptyGlyphStyle} aria-hidden>{copy.glyph}</span>
      <h2 style={emptyTitleStyle}>{copy.title}</h2>
      {copy.body && <p style={emptyBodyStyle}>{copy.body}</p>}
      {copy.cta === 'generate' && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onGenerate}>
          <Wand2 size={14} aria-hidden />
          {copy.ctaLabel}
        </button>
      )}
      {copy.cta === 'viewSaved' && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onViewSaved}>
          {copy.ctaLabel}
        </button>
      )}
    </div>
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

const emptyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '72px 24px',
  background: 'var(--bg-surface)',
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--r-lg)',
  textAlign: 'center',
}

const emptyGlyphStyle: CSSProperties = {
  fontSize: 48,
  lineHeight: 1,
}

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 20,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
}

const emptyBodyStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: 'var(--text-secondary)',
  maxWidth: 440,
}
