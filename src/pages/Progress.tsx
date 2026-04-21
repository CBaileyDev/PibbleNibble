/**
 * pages/Progress.tsx
 *
 * The Progress page — a celebratory rollup of everything Pibble & Nibble
 * have built together. Composed of four sections:
 *   1. Overall stats  — 4 KPI tiles
 *   2. Build history  — vertical timeline of completed builds
 *   3. Achievements   — 3-column grid with locked / unlocked states
 *   4. Shared stats   — Pibble vs Nibble bar chart comparison
 *
 * All data is mocked for now. Phase 7 will swap these constants for
 * Supabase queries / React Query hooks.
 */

import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { format } from 'date-fns'
import {
  Hammer,
  CheckCircle2,
  Footprints,
  Gamepad2,
  Trophy,
  Medal,
  Award,
  Target,
  Palette,
  Star,
  Lock,
} from 'lucide-react'

import { useMemo } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { useBuilds } from '@/hooks/useBuilds'
import { useProjects } from '@/hooks/useProjects'

/* ── Local types ────────────────────────────────────────────────────────── */

type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
type PlayerName = 'Pibble' | 'Nibble'

interface CompletedBuild {
  id: string
  name: string
  accentColor: string
  difficulty: Difficulty
  theme: string
  completedAt: string
}

interface Achievement {
  id: string
  icon: LucideIcon
  name: string
  description: string
  unlocked: boolean
}

interface PlayerStats {
  name: PlayerName
  color: string
  buildsCompleted: number
  stepsCompleted: number
  favoriteBuildType: string
}

/* ── Mock fallback data ─────────────────────────────────────────────────
   Used only for achievements + player comparison, which don't have a
   dedicated Supabase table yet. Overall stats and the build history
   timeline are now derived from live data (see inside the component).
   ───────────────────────────────────────────────────────────────────── */

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-build',
    icon: Star,
    name: 'First Build!',
    description: 'Complete any build from start to finish.',
    unlocked: true,
  },
  {
    id: 'five-builds',
    icon: Medal,
    name: '5 Builds Complete',
    description: 'Wrap up five unique builds.',
    unlocked: true,
  },
  {
    id: 'master-builder',
    icon: Trophy,
    name: 'Master Builder',
    description: 'Complete ten builds. You know what you’re doing.',
    unlocked: false,
  },
  {
    id: 'step-counter',
    icon: Footprints,
    name: 'Step Counter',
    description: 'Knock out 100 build steps across any projects.',
    unlocked: true,
  },
  {
    id: 'completionist',
    icon: Target,
    name: 'Completionist',
    description: 'Finish every material on a single build.',
    unlocked: true,
  },
  {
    id: 'variety-seeker',
    icon: Palette,
    name: 'Variety Seeker',
    description: 'Complete builds across 5 different themes.',
    unlocked: false,
  },
]

const PLAYER_STATS: PlayerStats[] = [
  {
    name: 'Pibble',
    color: '#00CCFF',
    buildsCompleted: 7,
    stepsCompleted: 184,
    favoriteBuildType: 'Cottage',
  },
  {
    name: 'Nibble',
    color: '#E0446A',
    buildsCompleted: 5,
    stepsCompleted: 134,
    favoriteBuildType: 'Tower',
  },
]

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

/* ── Achievement card ───────────────────────────────────────────────────── */

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { icon: Icon, name, description, unlocked } = achievement

  const baseStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-5) var(--space-4)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    transition:
      'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
  }

  const unlockedStyle: CSSProperties = {
    borderColor: 'color-mix(in oklab, var(--accent) 40%, var(--border))',
    boxShadow:
      '0 0 0 1px color-mix(in oklab, var(--accent) 18%, transparent), 0 0 24px var(--accent-glow), var(--shadow-sm)',
  }

  const lockedStyle: CSSProperties = {
    opacity: 0.55,
    filter: 'grayscale(0.85)',
  }

  return (
    <div
      style={{
        ...baseStyle,
        ...(unlocked ? unlockedStyle : lockedStyle),
      }}
    >
      {!unlocked && (
        <span
          aria-label="Locked"
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <Lock size={12} />
        </span>
      )}

      <div
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          background: unlocked
            ? 'var(--accent-subtle)'
            : 'var(--bg-elevated)',
          color: unlocked ? 'var(--accent)' : 'var(--text-muted)',
          border: `1px solid ${
            unlocked
              ? 'color-mix(in oklab, var(--accent) 40%, transparent)'
              : 'var(--border)'
          }`,
        }}
      >
        <Icon size={28} strokeWidth={2} />
      </div>

      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--text-primary)',
        }}
      >
        {name}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-snug)',
        }}
      >
        {description}
      </p>
      <span
        style={{
          marginTop: 'var(--space-1)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: unlocked ? 'var(--success)' : 'var(--text-muted)',
        }}
      >
        {unlocked ? 'Unlocked' : 'Locked'}
      </span>
    </div>
  )
}

/* ── Pibble-vs-Nibble comparison bar ────────────────────────────────────── */

interface ComparisonBarProps {
  label: string
  players: PlayerStats[]
  value: (p: PlayerStats) => number
}

function ComparisonBar({ label, players, value }: ComparisonBarProps) {
  const max = Math.max(...players.map(value), 1)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <h4
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </h4>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {players.map((p) => {
          const v = value(p)
          const pct = Math.max(4, (v / max) * 100)
          return (
            <div
              key={p.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr 60px',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 'var(--radius-xs)',
                    background: p.color,
                    boxShadow: `0 0 8px ${p.color}80`,
                  }}
                />
                {p.name}
              </span>

              <div
                style={{
                  position: 'relative',
                  height: 14,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  overflow: 'hidden',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: '0 auto 0 0',
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${p.color}, color-mix(in oklab, ${p.color} 70%, #000))`,
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.25)',
                    transition: 'width var(--dur-slow) var(--ease-out)',
                  }}
                />
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                }}
              >
                {formatNumber(v)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Favourite build type pill ──────────────────────────────────────────── */

function FavoriteTypes({ players }: { players: PlayerStats[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <h4
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        Favorite Build Type
      </h4>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
        }}
      >
        {players.map((p) => (
          <div
            key={p.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-surface)',
              border: `1px solid color-mix(in oklab, ${p.color} 40%, var(--border))`,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: 'var(--radius-xs)',
                background: p.color,
                boxShadow: `0 0 8px ${p.color}80`,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8125rem',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--text-primary)',
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: p.color,
                }}
              >
                {p.favoriteBuildType}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
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

      {/* 3. Achievements */}
      <SectionCard
        title="Achievements"
        subtitle="Milestones unlocked along the way."
        headerAction={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            {ACHIEVEMENTS.filter((a) => a.unlocked).length} / {ACHIEVEMENTS.length}
          </span>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-4)',
          }}
        >
          {ACHIEVEMENTS.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </SectionCard>

      {/* 4. Pibble vs Nibble shared stats */}
      <SectionCard
        title="Pibble vs Nibble"
        subtitle="Head-to-head building stats."
        headerAction={
          <span
            className="badge badge-neutral"
            style={{ gap: 6 }}
          >
            <Award size={12} /> Shared World
          </span>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-6)',
          }}
        >
          <ComparisonBar
            label="Builds Completed"
            players={PLAYER_STATS}
            value={(p) => p.buildsCompleted}
          />
          <ComparisonBar
            label="Steps Completed"
            players={PLAYER_STATS}
            value={(p) => p.stepsCompleted}
          />
        </div>

        <hr
          style={{
            height: 1,
            background: 'var(--border)',
            border: 0,
            margin: 'var(--space-6) 0 var(--space-5)',
          }}
        />

        <FavoriteTypes players={PLAYER_STATS} />
      </SectionCard>
    </PageLayout>
  )
}
