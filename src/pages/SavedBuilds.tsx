/**
 * pages/SavedBuilds.tsx
 *
 * Library of every build the user has saved or started.
 * Filters, search, sort, and per-tab empty states all live here.
 * Data is static mock for Phase 1–6; Phase 7 swaps in Supabase queries.
 */

import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wand2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { BuildCard, type BuildProject } from '@/components/build/BuildCard'
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

/* ───────────────────────── mock data ─────────────────────────
   Eight builds mixing all three lifecycle states. Replace with
   real queries in Phase 7. Shape matches the Dashboard's ambient
   MinecraftBuild usage. */

interface MockBuild {
  id: string
  title: string
  name?: string
  description: string
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
  progressionLevel: 'early' | 'mid' | 'late' | 'endgame'
  blockPalette: string[]
  createdAt: string
  updatedAt: string
}

const MOCK_BUILDS: MockBuild[] = [
  {
    id: 'build-mossy-cottage',
    title: 'Mossy Oak Cottage',
    description: 'A cozy woodland retreat with stone hearth and herb garden.',
    difficulty: 'medium',
    progressionLevel: 'early',
    blockPalette: ['#5E4028', '#7A5638', '#8AA64A', '#C9B180', '#4B5D2E'],
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-04-20T18:30:00Z',
  },
  {
    id: 'build-lantern-tower',
    title: 'Blackstone Lantern Tower',
    description: 'A tall nether-themed tower lit by soul lanterns.',
    difficulty: 'hard',
    progressionLevel: 'late',
    blockPalette: ['#1E1A1E', '#3C2F30', '#E8A23A', '#8B6B3F', '#0F0D10'],
    createdAt: '2026-04-18T14:00:00Z',
    updatedAt: '2026-04-18T14:00:00Z',
  },
  {
    id: 'build-koi-pavilion',
    title: 'Willow Koi Pavilion',
    description: 'A tranquil garden pavilion with a koi pond and cherry trees.',
    difficulty: 'easy',
    progressionLevel: 'mid',
    blockPalette: ['#C47B5C', '#E8C9A3', '#6FA5A0', '#3E5A48', '#D8526E'],
    createdAt: '2026-04-19T11:00:00Z',
    updatedAt: '2026-04-19T11:00:00Z',
  },
  {
    id: 'build-deepslate-vault',
    title: 'Deepslate Vault Chamber',
    description: 'A massive underground storage complex with cyan lighting.',
    difficulty: 'expert',
    progressionLevel: 'endgame',
    blockPalette: ['#1B2330', '#2E3A4E', '#00B0D9', '#5A6A80', '#0A0D12'],
    createdAt: '2026-04-20T08:00:00Z',
    updatedAt: '2026-04-20T08:00:00Z',
  },
  {
    id: 'build-cherry-bridge',
    title: 'Cherrywood Rope Bridge',
    description: 'A suspended walkway of cherry planks and dark oak posts.',
    difficulty: 'medium',
    progressionLevel: 'mid',
    blockPalette: ['#E492B0', '#B85A79', '#3A2A1A', '#D8C19A', '#6B4935'],
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-14T12:00:00Z',
  },
  {
    id: 'build-obsidian-spire',
    title: 'Obsidian Spire',
    description: 'A towering mage’s spire wreathed in soul-fire.',
    difficulty: 'expert',
    progressionLevel: 'endgame',
    blockPalette: ['#0D0818', '#2A1240', '#8848C4', '#F0E0FF', '#1A0C2E'],
    createdAt: '2026-03-28T14:00:00Z',
    updatedAt: '2026-04-02T16:45:00Z',
  },
  {
    id: 'build-willow-farm',
    title: 'Willow Wheat Farm',
    description: 'An automated wheat farm ringed by willow trees and a pond.',
    difficulty: 'beginner',
    progressionLevel: 'early',
    blockPalette: ['#8AA64A', '#E8D07C', '#6B8C3F', '#3E5A48', '#C9B180'],
    createdAt: '2026-04-01T10:30:00Z',
    updatedAt: '2026-04-11T19:00:00Z',
  },
  {
    id: 'build-copper-workshop',
    title: 'Copper Clockwork Workshop',
    description: 'A two-story tinkerer’s workshop of weathered copper and spruce.',
    difficulty: 'hard',
    progressionLevel: 'late',
    blockPalette: ['#B8623A', '#6E8E7A', '#3A2A1A', '#D8C19A', '#1F2A24'],
    createdAt: '2026-04-15T13:00:00Z',
    updatedAt: '2026-04-21T08:20:00Z',
  },
]

/** Pairs of (buildId → project). Only builds with entries here are
 *  in-progress or completed; the rest are "saved-only". */
const MOCK_PROJECTS: Record<string, BuildProject> = {
  'build-mossy-cottage': {
    id: 'proj-1',
    buildId: 'build-mossy-cottage',
    status: 'in-progress',
    progress: { current: 9, total: 24 },
    currentStepText: 'Place oak log frame for the second-floor walls',
    updatedAt: '2026-04-20T18:30:00Z',
  },
  'build-deepslate-vault': {
    id: 'proj-2',
    buildId: 'build-deepslate-vault',
    status: 'in-progress',
    progress: { current: 3, total: 40 },
    currentStepText: 'Excavate the central chamber',
    updatedAt: '2026-04-20T08:30:00Z',
  },
  'build-cherry-bridge': {
    id: 'proj-3',
    buildId: 'build-cherry-bridge',
    status: 'completed',
    progress: { current: 18, total: 18 },
    updatedAt: '2026-04-14T12:00:00Z',
  },
  'build-willow-farm': {
    id: 'proj-4',
    buildId: 'build-willow-farm',
    status: 'completed',
    progress: { current: 12, total: 12 },
    updatedAt: '2026-04-11T19:00:00Z',
  },
}

/* ───────────────────────── page component ───────────────────────── */

export function SavedBuilds() {
  const navigate = useNavigate()

  const [tab, setTab]       = useState<FilterTab>('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [query, setQuery]   = useState('')

  // Local state so "delete" and "save" do something visible with mock data.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set())
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({})

  const visibleBuilds = useMemo(
    () => MOCK_BUILDS.filter((b) => !deletedIds.has(b.id)),
    [deletedIds],
  )

  /* Counts per tab — always computed from the un-filtered set so pill
     badges don't shift as the user types into the search box. */
  const counts = useMemo(() => {
    let saved = 0
    let inProgress = 0
    let completed = 0
    for (const b of visibleBuilds) {
      const p = MOCK_PROJECTS[b.id]
      if (!p) saved++
      else if (p.status === 'in-progress') inProgress++
      else if (p.status === 'done' || p.status === 'completed') completed++
    }
    return {
      all:           visibleBuilds.length,
      saved,
      'in-progress': inProgress,
      completed,
    } satisfies Record<FilterTab, number>
  }, [visibleBuilds])

  /* Apply tab filter → search → sort. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filteredByTab = visibleBuilds.filter((b) => {
      const p = MOCK_PROJECTS[b.id]
      if (tab === 'all')         return true
      if (tab === 'saved')       return !p
      if (tab === 'in-progress') return p?.status === 'in-progress'
      if (tab === 'completed')   return p?.status === 'done' || p?.status === 'completed'
      return true
    })

    const searched = q
      ? filteredByTab.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q),
        )
      : filteredByTab

    const sorted = [...searched]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'oldest':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        case 'name-asc':
          return a.title.localeCompare(b.title)
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
  }, [visibleBuilds, tab, query, sortBy])

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
  function handleDelete(buildId: string) {
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.add(buildId)
      return next
    })
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
        {/* Filter pill tabs */}
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

        {/* Search + sort controls */}
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

        {/* Grid or per-tab empty state */}
        {filtered.length === 0 ? (
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
              const project = MOCK_PROJECTS[build.id]
              return (
                <BuildCard
                  key={build.id + (savedFlags[build.id] ? '-saved' : '')}
                  build={build as unknown as MinecraftBuild}
                  project={project}
                  onContinue={() => handleContinue(build.id)}
                  onView={() => handleView(build.id)}
                  onDelete={() => handleDelete(build.id)}
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
