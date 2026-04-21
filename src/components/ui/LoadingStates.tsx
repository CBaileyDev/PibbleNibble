/**
 * components/ui/LoadingStates.tsx
 *
 * Centralised skeletons, empty states, and the full-page AI-generation
 * overlay for Pibble & Nibble.
 *
 * Everything here reads from the design-token CSS variables (`--bg-card`,
 * `--bg-elevated`, `--border`, `--accent`, etc.) so both the Deepslate
 * dark theme and the Blossom light theme render correctly without any
 * theme-specific branches.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════════
   Keyframes & shared shimmer class
   ──────────────────────────────────────────────────────────────────────── */

const STYLE_ID = 'pn-loading-states-styles'
const SHIMMER_STYLES = `
@keyframes pn-skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes pn-crafting-spin {
  0%   { transform: rotate(0deg)    scale(1);    }
  50%  { transform: rotate(180deg)  scale(1.06); }
  100% { transform: rotate(360deg)  scale(1);    }
}
@keyframes pn-crafting-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 204, 255, 0.0), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.35); }
  50%      { box-shadow: 0 0 28px 6px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.35); }
}
@keyframes pn-overlay-fade-in {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to   { opacity: 1; backdrop-filter: blur(2px); }
}
@keyframes pn-msg-fade {
  0%   { opacity: 0; transform: translateY(6px); }
  12%  { opacity: 1; transform: translateY(0);   }
  88%  { opacity: 1; transform: translateY(0);   }
  100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes pn-progress-fill {
  from { width: 0%;   }
  to   { width: 100%; }
}

.pn-shimmer {
  background:
    linear-gradient(
      90deg,
      var(--bg-card) 0%,
      color-mix(in oklab, var(--bg-card) 72%, var(--text-secondary) 28%) 50%,
      var(--bg-card) 100%
    );
  background-size: 200% 100%;
  animation: pn-skeleton-shimmer 1.6s linear infinite;
  border-radius: var(--r-sm);
}
`

/** Inject keyframes + shimmer utility class once per document. */
function useInjectSkeletonStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.getElementById(STYLE_ID)) return
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = SHIMMER_STYLES
    document.head.appendChild(el)
  }, [])
}

/** A single shimmer block with configurable size / radius. */
function SkeletonBlock({
  width = '100%',
  height = 12,
  radius = 'var(--r-sm)',
  style,
  className,
}: {
  width?: number | string
  height?: number | string
  radius?: number | string
  style?: CSSProperties
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={`pn-shimmer ${className ?? ''}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  )
}

/* ════════════════════════════════════════════════════════════════════════
   BuildCardSkeleton
   ────────────────────────────────────────────────────────────────────────
   Matches BuildCard proportions: a 36-px palette strip followed by a
   body containing title, tag row, progress meta, and a stacked button
   footer.
   ──────────────────────────────────────────────────────────────────────── */

export function BuildCardSkeleton() {
  useInjectSkeletonStyles()
  return (
    <article style={cardRootStyle} aria-busy aria-label="Loading build">
      {/* Palette strip */}
      <div style={paletteStripStyle}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pn-shimmer"
            style={{
              borderRadius: 0,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>

      <div style={cardBodyStyle}>
        {/* Title */}
        <SkeletonBlock height={18} width="70%" />

        {/* Tag row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <SkeletonBlock height={18} width={72} radius="var(--r-sm)" />
          <SkeletonBlock height={18} width={88} radius="var(--r-sm)" />
        </div>

        {/* Progress meta (approximates an in-progress card so the footprint
           is stable whether the real build ends up with or without a bar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonBlock height={10} width={82} />
            <SkeletonBlock height={10} width={32} />
          </div>
          <SkeletonBlock height={12} width="100%" radius="var(--r-xs)" />
        </div>

        {/* Footer buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBlock height={34} width="100%" radius="var(--r-sm)" />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBlock height={28} width={96} radius="var(--r-sm)" />
            <SkeletonBlock height={28} width={28} radius="var(--r-sm)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </div>
    </article>
  )
}

const cardRootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  minHeight: 280,
}

const paletteStripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  height: 36,
  flexShrink: 0,
}

const cardBodyStyle: CSSProperties = {
  padding: '16px 18px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  flex: 1,
}

/* ════════════════════════════════════════════════════════════════════════
   StatCardSkeleton
   ──────────────────────────────────────────────────────────────────────── */

export function StatCardSkeleton() {
  useInjectSkeletonStyles()
  return (
    <div style={statCardStyle} aria-busy aria-label="Loading stat">
      <SkeletonBlock height={36} width={36} radius="var(--r-sm)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <SkeletonBlock height={28} width="50%" />
        <SkeletonBlock height={11} width="72%" />
      </div>
    </div>
  )
}

const statCardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: 16,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
  minHeight: 88,
}

/* ════════════════════════════════════════════════════════════════════════
   DashboardSkeleton
   ────────────────────────────────────────────────────────────────────────
   Mirrors the Dashboard's layout so the page doesn't jump when data
   arrives: 4-col stats row, active project card, 3-col recent builds
   grid, plus a right-column sidebar (notes + activity).
   ──────────────────────────────────────────────────────────────────────── */

export function DashboardSkeleton() {
  useInjectSkeletonStyles()
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      aria-busy
      aria-label="Loading dashboard"
    >
      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Two-column main layout */}
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
          {/* Active Project */}
          <div style={sectionCardStyle}>
            <SectionHeaderSkeleton titleWidth={160} subtitleWidth={220} />
            <div style={{ display: 'flex', gap: 14, padding: 18 }}>
              <SkeletonBlock width={88} height={88} radius="var(--r-md)" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SkeletonBlock height={20} width="60%" />
                <SkeletonBlock height={12} width="88%" />
                <SkeletonBlock height={12} width="100%" radius="var(--r-xs)" />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <SkeletonBlock height={30} width={140} />
                  <SkeletonBlock height={30} width={96} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent builds */}
          <div style={sectionCardStyle}>
            <SectionHeaderSkeleton titleWidth={200} subtitleWidth={180} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-4)',
                padding: 18,
              }}
            >
              {[0, 1, 2].map((i) => (
                <BuildCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* World notes */}
          <div style={sectionCardStyle}>
            <SectionHeaderSkeleton titleWidth={130} subtitleWidth={100} />
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <SkeletonBlock key={i} height={44} width="100%" radius="var(--r-sm)" />
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div style={sectionCardStyle}>
            <SectionHeaderSkeleton titleWidth={140} />
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <SkeletonBlock width={22} height={22} radius="var(--r-xs)" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SkeletonBlock height={11} width="80%" />
                    <SkeletonBlock height={9} width="40%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionCardStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
}

function SectionHeaderSkeleton({
  titleWidth = 160,
  subtitleWidth,
}: {
  titleWidth?: number
  subtitleWidth?: number
}) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <SkeletonBlock height={16} width={titleWidth} />
      {subtitleWidth !== undefined && <SkeletonBlock height={11} width={subtitleWidth} />}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   InstructionsSkeleton
   ────────────────────────────────────────────────────────────────────────
   Matches BuildDetail's split-panel layout: header band + 3/2 grid
   (phase/step card on the left, materials checklist on the right).
   ──────────────────────────────────────────────────────────────────────── */

export function InstructionsSkeleton() {
  useInjectSkeletonStyles()
  return (
    <div
      style={{
        maxWidth: 1024,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
      aria-busy
      aria-label="Loading build instructions"
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <SkeletonBlock height={28} width="40%" />
          <div style={{ display: 'flex', gap: 6 }}>
            <SkeletonBlock height={20} width={64} />
            <SkeletonBlock height={20} width={72} />
            <SkeletonBlock height={20} width={40} />
          </div>
        </div>
        <SkeletonBlock height={14} width="78%" />
        <SkeletonBlock height={12} width="100%" radius="var(--r-xs)" />
      </div>

      {/* Split panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: 20,
        }}
      >
        {/* Left — phases + steps */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
          }}
        >
          {/* Phase tab bar */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 10,
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
            }}
          >
            {[100, 120, 110, 90].map((w, i) => (
              <SkeletonBlock key={i} width={w} height={26} radius="var(--r-sm)" />
            ))}
          </div>
          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                <SkeletonBlock width={22} height={22} radius="var(--r-xs)" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SkeletonBlock height={13} width="55%" />
                  <SkeletonBlock height={10} width="100%" />
                  <SkeletonBlock height={10} width="88%" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — materials */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
          }}
        >
          <SectionHeaderSkeleton titleWidth={120} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SkeletonBlock width={18} height={18} radius="var(--r-xs)" />
                <SkeletonBlock width={22} height={22} radius="var(--r-xs)" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <SkeletonBlock height={11} width="70%" />
                  <SkeletonBlock height={9} width="40%" />
                </div>
                <SkeletonBlock width={36} height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   EmptyState
   ────────────────────────────────────────────────────────────────────────
   Reusable centered empty state with a large muted glyph, heading,
   subtext, and optional CTA. Used across Dashboard, SavedBuilds,
   BuildResults, and any other page that might end up data-less.
   ──────────────────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  /** Large muted glyph — can be an emoji string, lucide-react icon node,
   *  or any arbitrary ReactNode. */
  icon: ReactNode
  title: string
  subtitle?: string
  ctaLabel?: string
  onCta?: () => void
  /** Optional secondary action. */
  secondaryLabel?: string
  onSecondary?: () => void
  /** Merge custom styles into the outer wrapper. */
  style?: CSSProperties
}

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
  style,
}: EmptyStateProps) {
  return (
    <div style={{ ...emptyStateStyle, ...style }}>
      <div style={emptyGlyphStyle} aria-hidden>
        {icon}
      </div>
      <h2 style={emptyTitleStyle}>{title}</h2>
      {subtitle && <p style={emptyBodyStyle}>{subtitle}</p>}
      {(ctaLabel || secondaryLabel) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {ctaLabel && onCta && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onCta}>
              {ctaLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  padding: '72px 24px',
  background: 'var(--bg-surface)',
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--r-lg)',
  textAlign: 'center',
}

const emptyGlyphStyle: CSSProperties = {
  fontSize: 52,
  lineHeight: 1,
  color: 'var(--text-muted)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 72,
  height: 72,
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
  lineHeight: 1.5,
}

/* ════════════════════════════════════════════════════════════════════════
   BuildGeneratingOverlay
   ────────────────────────────────────────────────────────────────────────
   Full-page dimmer shown while Claude is generating a batch of builds.
   Displays an animated crafting-table block, a phase-specific headline,
   and a chunky progress bar that fills over ~15 seconds.
   ──────────────────────────────────────────────────────────────────────── */

export type BuildGeneratingPhase = 'thinking' | 'designing' | 'calculating'

export interface BuildGeneratingOverlayProps {
  isVisible: boolean
  phase: BuildGeneratingPhase
  /** Total duration the progress bar should take to fill, in ms. */
  durationMs?: number
}

const PHASE_COPY: Record<BuildGeneratingPhase, { title: string; sub: string }> = {
  thinking: {
    title: 'Thinking about your build…',
    sub: 'Archie is studying your request',
  },
  designing: {
    title: 'Designing 3 unique options…',
    sub: 'Sketching variations block by block',
  },
  calculating: {
    title: 'Counting materials…',
    sub: 'Verifying every block and step',
  },
}

export function BuildGeneratingOverlay({
  isVisible,
  phase,
  durationMs = 15000,
}: BuildGeneratingOverlayProps) {
  useInjectSkeletonStyles()

  if (!isVisible) return null

  const copy = PHASE_COPY[phase]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Generating builds"
      style={overlayRootStyle}
    >
      <div style={overlayCardStyle}>
        <CraftingTableGlyph />

        <div
          // Keyed so the text fades in again whenever the phase changes.
          key={phase}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            animation: 'pn-msg-fade 900ms var(--ease-out) forwards',
            minHeight: 58,
          }}
        >
          <h3 style={overlayTitleStyle}>{copy.title}</h3>
          <p style={overlaySubStyle}>{copy.sub}</p>
        </div>

        {/* Chunky progress bar — fills over durationMs */}
        <div className="chunky-progress" style={overlayProgressStyle} aria-hidden>
          <div
            className="chunky-progress-fill"
            style={{
              width: '100%',
              animation: `pn-progress-fill ${durationMs}ms linear forwards`,
            }}
          />
        </div>

        <p style={overlayFootnoteStyle}>Claude AI · Generating</p>
      </div>
    </div>
  )
}

function CraftingTableGlyph() {
  /**
   * Small pixel-art-ish "crafting table": a 3×3 grid of accent blocks
   * wrapped in a rotating pulsing frame.
   */
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: 88,
        height: 88,
        animation:
          'pn-crafting-spin 6s linear infinite, pn-crafting-pulse 2.4s ease-in-out infinite',
        borderRadius: 'var(--r-md)',
        background: 'var(--bg-elevated)',
        border: '2px solid var(--accent)',
        padding: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.35)',
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          style={{
            background: i % 2 === 0 ? 'var(--accent)' : 'var(--accent-subtle)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.25)',
            borderRadius: 2,
            opacity: 0.85 - (i % 3) * 0.12,
          }}
        />
      ))}
    </div>
  )
}

const overlayRootStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  animation: 'pn-overlay-fade-in 240ms var(--ease-out) both',
}

const overlayCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 22,
  padding: '36px 44px',
  width: '100%',
  maxWidth: 480,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--r-lg)',
  boxShadow: 'var(--shadow-lg)',
  textAlign: 'center',
}

const overlayTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
}

const overlaySubStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'var(--text-secondary)',
}

const overlayProgressStyle: CSSProperties = {
  width: '100%',
  height: 14,
}

const overlayFootnoteStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

/* ════════════════════════════════════════════════════════════════════════
   usePhaseCycler
   ────────────────────────────────────────────────────────────────────────
   Convenience hook: cycles the overlay's phase through
   thinking → designing → calculating over a total ~15s window.
   ──────────────────────────────────────────────────────────────────────── */

export function usePhaseCycler(active: boolean, totalMs = 15000): BuildGeneratingPhase {
  const [phase, setPhase] = useState<BuildGeneratingPhase>('thinking')

  useEffect(() => {
    if (!active) {
      setPhase('thinking')
      return
    }
    setPhase('thinking')
    const t1 = window.setTimeout(() => setPhase('designing'), Math.round(totalMs * 0.33))
    const t2 = window.setTimeout(() => setPhase('calculating'), Math.round(totalMs * 0.66))
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [active, totalMs])

  return phase
}
