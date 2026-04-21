/**
 * pages/BuildResults.tsx
 *
 * Shown after the Build Designer returns a batch of AI-generated builds.
 * The route state carries `{ builds: MinecraftBuild[] }`; this page renders
 * them in a responsive grid of BuildResultCard components.
 *
 *   • Start Project  → navigate to /builds/:id, passing the build via state
 *                      so BuildDetail can bootstrap a local BuildProject.
 *   • Save for Later → append to a local saved-IDs set. Supabase persistence
 *                      lands in Phase 7 via useSaveBuild().
 */

import { useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BuildResultCard } from '@/components/build/BuildResultCard'
import { useBuilds } from '@/hooks/useBuilds'
import { toast } from '@/components/ui/Toast'
import type { MinecraftBuild } from '@/types/build'

interface BuildResultsLocationState {
  builds?: MinecraftBuild[]
}

export function BuildResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { saveBuild } = useBuilds()
  const state = (location.state ?? {}) as BuildResultsLocationState
  const builds = state.builds ?? []

  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())

  async function persist(build: MinecraftBuild) {
    try {
      await saveBuild(build)
      setSavedIds((prev) => {
        if (prev.has(build.id)) return prev
        const next = new Set(prev)
        next.add(build.id)
        return next
      })
    } catch {
      toast.error('Failed to save build')
    }
  }

  async function handleStart(build: MinecraftBuild) {
    // Persist first so the detail page can load it fresh from Supabase.
    await persist(build)
    navigate(`/builds/${build.id}`, { state: { build } })
  }

  function handleSave(build: MinecraftBuild) {
    void persist(build)
  }

  function handleRegenerate() {
    navigate('/build-designer')
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100dvh',
        padding: '44px 32px 96px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <PageHeader
          count={builds.length}
          onRegenerate={handleRegenerate}
        />

        {builds.length === 0 ? (
          <EmptyState onRegenerate={handleRegenerate} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {builds.map((build, i) => (
              <BuildResultCard
                key={build.id}
                build={build}
                index={i}
                onStart={() => void handleStart(build)}
                onSave={() => handleSave(build)}
              />
            ))}
          </div>
        )}

        {builds.length > 0 && (
          <FooterHint
            savedCount={savedIds.size}
            totalCount={builds.length}
            onAdjust={handleRegenerate}
            onSaveAll={() => {
              builds.forEach((b) => handleSave(b))
            }}
          />
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════════════════ */

function PageHeader({
  count,
  onRegenerate,
}: {
  count: number
  onRegenerate: () => void
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
        paddingBottom: 28,
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        animation: 'header-in 560ms var(--ease-out) both',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            flexWrap: 'wrap',
          }}
        >
          <span>Designer</span>
          <span>/</span>
          <span>New Quest</span>
          <span>/</span>
          <span style={{ color: 'var(--accent)' }}>Results</span>
          {count > 0 && (
            <span
              style={{
                marginLeft: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'var(--accent-subtle)',
                border: '1px solid rgba(0,204,255,0.25)',
                borderRadius: 'var(--r-xs)',
                color: 'var(--accent)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }}
              />
              {count} {count === 1 ? 'build' : 'builds'} generated
            </span>
          )}
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 52,
            letterSpacing: 'var(--tracking-display)',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            lineHeight: 1.05,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <SparkleGlyph />
          <span>Your builds are ready!</span>
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 16,
            color: 'var(--text-secondary)',
            maxWidth: 620,
          }}
        >
          Choose a build to start, or save them all for later.
        </p>
      </div>

      <button
        type="button"
        onClick={onRegenerate}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
          e.currentTarget.style.background = 'var(--accent-subtle)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-strong)'
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'transparent'
        }}
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          background: 'transparent',
          border: '1.5px solid var(--border-strong)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        Generate Again
      </button>
    </header>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SPARKLE GLYPH
   ══════════════════════════════════════════════════════════════════════════ */

interface Twinkle {
  top: number
  left: number
  size: number
  delay: string
  dur: string
}

const TWINKLES: Twinkle[] = [
  { top: -4, left: -6,  size: 5, delay: '0s',   dur: '2.4s' },
  { top: 18, left: -14, size: 3, delay: '0.5s', dur: '3.0s' },
  { top: 36, left: 4,   size: 4, delay: '1.1s', dur: '2.2s' },
  { top: -8, left: 42,  size: 3, delay: '0.3s', dur: '2.8s' },
  { top: 32, left: 48,  size: 5, delay: '0.9s', dur: '2.6s' },
  { top: 10, left: 56,  size: 3, delay: '1.4s', dur: '3.2s' },
]

function SparkleGlyph() {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 60,
        height: 60,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 56,
          lineHeight: 1,
          animation: 'sparkle-pulse 2.4s ease-in-out infinite',
        }}
      >
        ✨
      </span>
      {TWINKLES.map((t, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: t.top,
            left: t.left,
            width: t.size,
            height: t.size,
            background: 'var(--accent)',
            boxShadow: `0 0 ${t.size * 2}px var(--accent)`,
            animation: `twinkle ${t.dur} ease-in-out infinite`,
            animationDelay: t.delay,
            pointerEvents: 'none',
          }}
        />
      ))}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════════════════════════════ */

function EmptyState({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '72px 24px',
        background: 'var(--bg-surface)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--r-lg)',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden="true">⛏️</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          No builds to show
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--text-secondary)',
            maxWidth: 420,
          }}
        >
          Head back to the designer and sketch out what you want — the AI
          will return a batch of variations to choose from.
        </p>
      </div>
      <button
        type="button"
        onClick={onRegenerate}
        className="btn btn-primary"
      >
        Open Build Designer
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER HINT
   ══════════════════════════════════════════════════════════════════════════ */

function FooterHint({
  savedCount,
  totalCount,
  onAdjust,
  onSaveAll,
}: {
  savedCount: number
  totalCount: number
  onAdjust: () => void
  onSaveAll: () => void
}) {
  const footerBtn: CSSProperties = {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--r-sm)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '18px 22px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            background: 'var(--text-muted)',
          }}
        />
        {savedCount > 0
          ? `${savedCount} saved`
          : 'Not loving these?'}
      </span>
      <button type="button" style={footerBtn} onClick={onAdjust}>
        Adjust Prompt
      </button>
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}
      >
        or
      </span>
      <button type="button" style={footerBtn} onClick={onSaveAll}>
        Save All · ×{totalCount}
      </button>
    </div>
  )
}
