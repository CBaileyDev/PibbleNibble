/**
 * pages/Progress.tsx
 *
 * Celebratory rollup of everything Pibble & Nibble have built.
 *   1. Overall stats — 4 KPI tiles (live)
 *   2. Build history — vertical timeline of completed builds (live)
 *
 * Earlier drafts had an Achievements grid and a Pibble-vs-Nibble comparison,
 * but those were hardcoded mock data with no pipeline behind them. They've
 * been removed until real inputs exist.
 */

import { useMemo, type CSSProperties } from 'react'
import { format } from 'date-fns'
import {
  Hammer,
  CheckCircle2,
  Footprints,
  Gamepad2,
} from 'lucide-react'

import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { useBuilds } from '@/hooks/useBuilds'
import { useProjects } from '@/hooks/useProjects'

/* ── Local types ────────────────────────────────────────────────────────── */

type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

interface CompletedBuild {
  id: string
  name: string
  accentColor: string
  difficulty: Difficulty
  theme: string
  completedAt: string
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

const difficultyClass: Record<Difficulty, string> = {
  beginner: 'diff-beginner',
  easy:     'diff-easy',
  medium:   'diff-medium',
  hard:     'diff-hard',
  expert:   'diff-expert',
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/* ── Timeline ───────────────────────────────────────────────────────────── */

interface TimelineProps {
  builds: CompletedBuild[]
}

function BuildTimeline({ builds }: TimelineProps) {
  const sorted = [...builds].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )

  if (!sorted.length) {
    return (
      <p
        style={{
          margin: 0,
          padding: 'var(--space-6) var(--space-4)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
        }}
      >
        No completed builds yet. Finish your first one to start the timeline!
      </p>
    )
  }

  return (
    <ol
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        position: 'relative',
      }}
    >
      {/* Connecting vertical line — runs down the centre of the dot column */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 7,
          top: 8,
          bottom: 8,
          width: 2,
          background:
            'linear-gradient(var(--border-strong), var(--border) 70%, transparent)',
          borderRadius: 1,
        }}
      />

      {sorted.map((build, i) => (
        <li
          key={build.id}
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '16px 1fr',
            columnGap: 'var(--space-4)',
            paddingBottom: i === sorted.length - 1 ? 0 : 'var(--space-5)',
          }}
        >
          {/* Coloured dot */}
          <span
            aria-hidden
            style={
              {
                alignSelf: 'start',
                marginTop: 6,
                width: 16,
                height: 16,
                borderRadius: 'var(--radius-sm)',
                background: build.accentColor,
                boxShadow:
                  '0 0 0 3px var(--bg-card), 0 0 12px var(--dot-glow)',
                '--dot-glow': `${build.accentColor}66`,
              } as CSSProperties
            }
          />

          {/* Entry body */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-display)',
                }}
              >
                {build.name}
              </h3>
              <span className={`badge ${difficultyClass[build.difficulty]}`}>
                {build.difficulty}
              </span>
              <time
                dateTime={build.completedAt}
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {format(new Date(build.completedAt), 'MMM d, yyyy')}
              </time>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{build.theme}</span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ── Page component ─────────────────────────────────────────────────────── */

export function Progress() {
  const { builds } = useBuilds()
  const { projects } = useProjects()

  const completedBuilds: CompletedBuild[] = useMemo(() => {
    const buildsById = new Map(builds.map((b) => [b.id, b]))
    return projects
      .filter((p) => p.status === 'done' || p.status === 'completed')
      .map<CompletedBuild | null>((p) => {
        const b = buildsById.get(p.buildId)
        if (!b) return null
        return {
          id: b.id,
          name: b.name,
          accentColor: b.blockPalette?.colorHexes?.[0] ?? '#6d83f2',
          difficulty: b.difficulty as Difficulty,
          theme: b.theme,
          completedAt: p.updatedAt,
        }
      })
      .filter((x): x is CompletedBuild => x !== null)
  }, [builds, projects])

  const totalBuildsGenerated = builds.length
  const buildsCompleted = projects.filter(
    (p) => p.status === 'done' || p.status === 'completed',
  ).length
  const totalStepsCompleted = projects.reduce(
    (sum, p) => sum + p.completedSteps.length,
    0,
  )
  const activeProjects = projects.filter((p) => p.status === 'in-progress').length

  return (
    <PageLayout
      title="Progress"
      subtitle="Everything Pibble & Nibble have built so far."
    >
      {/* 1. Overall stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
        }}
      >
        <StatCard
          icon={Hammer}
          value={formatNumber(totalBuildsGenerated)}
          label="Total Builds Generated"
        />
        <StatCard
          icon={CheckCircle2}
          value={formatNumber(buildsCompleted)}
          label="Builds Completed"
        />
        <StatCard
          icon={Footprints}
          value={formatNumber(totalStepsCompleted)}
          label="Total Steps Completed"
        />
        <StatCard
          icon={Gamepad2}
          value={formatNumber(activeProjects)}
          label="Active Projects"
        />
      </div>

      {/* 2. Build history timeline */}
      <SectionCard
        title="Build History"
        subtitle="Your completed builds, most recent first."
      >
        <BuildTimeline builds={completedBuilds} />
      </SectionCard>
    </PageLayout>
  )
}
