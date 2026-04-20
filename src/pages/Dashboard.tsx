import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BuildCard } from '@/components/build/BuildCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PaletteStrip } from '@/components/ui/PaletteStrip'
import { ChunkyProgress } from '@/components/ui/ChunkyProgress'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DiffBadge } from '@/components/ui/DiffBadge'
import { useBuilds } from '@/hooks/useBuilds'
import { useUserStore } from '@/stores/userStore'
import { toBuildDisplay } from '@/lib/buildDisplay'
import { MOCK_BUILDS, MOCK_COMPACT } from '@/lib/mockBuilds'
import type { BuildDisplayData, BuildStatus } from '@/types/display'

const FILTER_TABS: { id: BuildStatus | 'all'; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'todo',        label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed',   label: 'Completed' },
]

const STAT_ITEMS = [
  { label: 'Active Builds',  key: 'active',    value: '2'      },
  { label: 'Completed',      key: 'completed',  value: '14'     },
  { label: 'Blocks Placed',  key: 'blocks',     value: '28,431', mono: true },
  { label: 'Session Streak', key: 'streak',     value: '9 days' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<BuildStatus | 'all'>('all')
  const user = useUserStore((s) => s.user)

  const { data: rawBuilds = [] } = useBuilds()

  const builds: BuildDisplayData[] =
    rawBuilds.length > 0 ? rawBuilds.map(toBuildDisplay) : MOCK_BUILDS

  const compactBuilds: BuildDisplayData[] = MOCK_COMPACT

  const featured = builds.find((b) => b.status === 'in-progress') ?? builds[0]

  const filtered =
    filter === 'all' ? builds : builds.filter((b) => b.status === filter)

  const displayName = user?.profile.displayName ?? 'Nibble'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '36px 28px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 48,
      }}
    >
      {/* ── Welcome + stats ── */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              ◆ Evening Session · Day 47
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1.25,
                letterSpacing: '0.015em',
                color: 'var(--text-primary)',
              }}
            >
              Welcome back, {displayName}
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)' }}>
              You and Pibble have {builds.filter((b) => b.status === 'in-progress').length} active builds. Let's keep crafting.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary">Explore</Button>
            <Button variant="primary" onClick={() => navigate('/build-designer')}>
              ✦ Generate New Build
            </Button>
          </div>
        </div>

        <StatsRow />
      </section>

      {/* ── Featured active build ── */}
      {featured && (
        <section>
          <SectionHeader kicker="CONTINUE" title="Your Active Build">
            <Button variant="ghost" size="sm" onClick={() => navigate('/saved-builds')}>
              All projects →
            </Button>
          </SectionHeader>
          <FeaturedBuild build={featured} />
        </section>
      )}

      {/* ── Recently generated compact grid ── */}
      <section>
        <SectionHeader kicker="RECENTLY GENERATED" title="Fresh from the Forge">
          <Button variant="ghost" size="sm" onClick={() => navigate('/saved-builds')}>
            See library →
          </Button>
        </SectionHeader>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {compactBuilds.map((b) => (
            <BuildCard key={b.id} build={b} compact />
          ))}
        </div>
      </section>

      {/* ── Full library ── */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              FULL LIBRARY
            </span>
            <h2
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 32,
                letterSpacing: '0.02em',
                color: 'var(--text-primary)',
              }}
            >
              All Your Builds
            </h2>
          </div>

          <div className="tabs">
            {FILTER_TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${filter === t.id ? 'active' : ''}`}
                onClick={() => setFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {filtered.map((b) => (
            <BuildCard key={b.id} build={b} />
          ))}
        </div>
      </section>
    </motion.div>
  )
}

/* ── Stat tiles ── */
function StatsRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {STAT_ITEMS.map((s) => (
        <Card key={s.key} style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
          <div
            style={{
              fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-display)',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ── Section header ── */
function SectionHeader({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {kicker}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

/* ── Featured build (large hero card) ── */
function FeaturedBuild({ build }: { build: BuildDisplayData }) {
  const navigate = useNavigate()
  return (
    <Card
      style={{
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
      }}
    >
      {/* Left: gradient preview panel */}
      <div
        style={{
          position: 'relative',
          background: `linear-gradient(135deg, ${build.palette[0]} 0%, ${build.palette[1]} 50%, ${build.palette[3]} 100%)`,
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <PaletteStrip colors={build.palette} height={22} />

        {/* Diagonal texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 12px)',
            pointerEvents: 'none',
          }}
        />

        {/* Coordinates chip */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            margin: 24,
            padding: '16px 18px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 3,
            alignSelf: 'flex-end',
            color: '#FFF',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: '0.1em', marginBottom: 4 }}>
            COORDINATES
          </div>
          X: 248 · Y: 64 · Z: -1,192
        </div>
      </div>

      {/* Right: build info */}
      <div style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatusBadge status={build.status} />
          <DiffBadge level={build.difficulty} />
          {build.biome && <span className="badge badge-neutral">{build.biome}</span>}
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1.1,
            letterSpacing: '0.015em',
            color: 'var(--text-primary)',
          }}
        >
          {build.name}
        </h2>

        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, maxWidth: 440 }}>
          A cozy woodland retreat tucked into the hillside. Features a stone hearth,
          reading nook, and an herb garden out back. Built together with Pibble.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '14px 0',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <StatPill label="Dimensions" value={build.dims} mono />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <StatPill
            label="Progress"
            value={build.progress ? `${build.progress.current}/${build.steps} steps` : `${build.steps} steps`}
            mono
          />
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <StatPill label="Last Session" value="2h ago" />
        </div>

        {build.progress && (
          <ChunkyProgress value={build.progress.current} max={build.progress.total} />
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <Button variant="primary" onClick={() => navigate('/saved-builds')}>
            Continue Building →
          </Button>
          <Button variant="secondary">
            View Steps
          </Button>
        </div>
      </div>
    </Card>
  )
}

function StatPill({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
