/**
 * components/build/BuildResultCard.tsx
 *
 * The result card rendered in the grid on the Build Results page.
 * Presents a MinecraftBuild in full: palette strip, name, tagline,
 * difficulty/progression/biome pills, stat readout, description,
 * and the Start / Save action pair.
 *
 * Hover raises the card (translateY) with a cyan accent glow and
 * saturates the palette strip; corner cuts appear for Minecraft flavour.
 */

import { useState, type CSSProperties, type ReactNode } from 'react'
import type {
  MinecraftBuild,
  Difficulty,
  ProgressionLevel,
  Biome,
} from '@/types/build'

/* ── Difficulty display mapping ──────────────────────────────────────────── */

interface DifficultyDisplay {
  label: string
  tone: string
  swords: number
}

const DIFFICULTY_DISPLAY: Record<Difficulty, DifficultyDisplay> = {
  beginner: { label: 'Beginner', tone: '#22D45A', swords: 1 },
  easy:     { label: 'Easy',     tone: '#7BCF3F', swords: 2 },
  medium:   { label: 'Medium',   tone: '#FFB020', swords: 3 },
  hard:     { label: 'Hard',     tone: '#FF7A3C', swords: 4 },
  expert:   { label: 'Expert',   tone: '#FF4455', swords: 5 },
}

const PROGRESSION_LABEL: Record<ProgressionLevel, string> = {
  early:   'Early Game',
  mid:     'Mid Game',
  late:    'Late Game',
  endgame: 'End Game',
}

const BIOME_LABEL: Record<Biome, string> = {
  plains:   'Plains',
  forest:   'Forest',
  snowy:    'Snowy',
  desert:   'Desert',
  jungle:   'Jungle',
  mushroom: 'Mushroom',
  mesa:     'Mesa',
  swamp:    'Swamp',
  ocean:    'Ocean',
}

/* ── Props ───────────────────────────────────────────────────────────────── */

export interface BuildResultCardProps {
  build: MinecraftBuild
  onStart: () => void
  onSave: () => void
  /** Optional 0-based position in the grid — renders as the "Option · 01" chip. */
  index?: number
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function BuildResultCard({ build, onStart, onSave, index }: BuildResultCardProps) {
  const [hover, setHover] = useState(false)

  const difficulty = DIFFICULTY_DISPLAY[build.difficulty]
  const progressionLabel = PROGRESSION_LABEL[build.progressionLevel]
  const biomeLabel = BIOME_LABEL[build.biome]

  const { width, height, depth, totalBlocks } = build.dimensions
  const uniqueMaterials = build.materials.length
  const phaseCount = build.phases.length
  const stepCount = build.phases.reduce((sum, p) => sum + p.steps.length, 0)
  const hours = Math.max(1, Math.round(build.estimatedMinutes / 60))

  const palette = build.visualPreview.colorPalette
  const tagline = build.visualPreview.highlightFeature
  const description = build.visualPreview.previewDescription || build.description

  const cardStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-card)',
    border: `1.5px solid ${hover ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--r-lg)',
    overflow: 'hidden',
    cursor: 'default',
    transform: hover ? 'translateY(-6px)' : 'translateY(0)',
    boxShadow: hover
      ? '0 20px 40px rgba(0,0,0,0.9), 0 0 0 1px var(--accent-glow), 0 0 28px rgba(0,204,255,0.28), var(--shadow-lg)'
      : 'var(--shadow-sm)',
    transition:
      'transform var(--dur-base) var(--ease-out),' +
      'box-shadow var(--dur-base) var(--ease-out),' +
      'border-color var(--dur-base) var(--ease-out)',
    animation: 'card-in 620ms var(--ease-snap) both',
    animationDelay: `${180 + (index ?? 0) * 120}ms`,
  }

  return (
    <article
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Option · NN chip */}
      {typeof index === 'number' && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 3,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 9px',
            background: 'rgba(7,10,15,0.75)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(4px)',
          }}
        >
          Option · {String(index + 1).padStart(2, '0')}
        </span>
      )}

      <PaletteStripInline colors={palette} saturate={hover} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '22px 22px 18px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.06em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            textWrap: 'balance',
          }}
        >
          {build.name}
        </h3>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            fontWeight: 500,
            color: 'var(--accent)',
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          <DifficultyPill difficulty={difficulty} />
          <Pill>{progressionLabel}</Pill>
          <Pill icon="biome">{biomeLabel}</Pill>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 4,
            paddingTop: 14,
            borderTop: '1px dashed var(--border)',
          }}
        >
          <StatLine
            label="dimensions"
            mono
            value={`${width} × ${height} × ${depth} blocks`}
          />
          <StatLine
            label="materials"
            value={
              <>
                <Strong>{uniqueMaterials}</Strong> unique ·{' '}
                <Strong>{totalBlocks.toLocaleString()}</Strong> total
              </>
            }
          />
          <StatLine
            label="build plan"
            value={
              <>
                <Strong>{phaseCount}</Strong> phases ·{' '}
                <Strong>{stepCount}</Strong> steps · <Strong>~{hours}h</Strong>
              </>
            }
          />
        </div>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            lineHeight: 1.55,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            textWrap: 'pretty',
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '16px 22px 22px',
          marginTop: 'auto',
          borderTop: '1px solid var(--border)',
          background:
            'linear-gradient(to bottom, transparent, rgba(0,204,255,0.02))',
        }}
      >
        <StartButton onClick={onStart} />
        <SaveButton onClick={onSave} />
      </div>

      {hover && <CornerCuts />}
    </article>
  )
}

/* ── Palette strip ───────────────────────────────────────────────────────── */

function PaletteStripInline({
  colors,
  saturate,
}: {
  colors: string[]
  saturate: boolean
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${colors.length}, 1fr)`,
        height: 36,
        overflow: 'hidden',
        filter: saturate
          ? 'saturate(1.35) brightness(1.08)'
          : 'saturate(0.85) brightness(0.92)',
        transition: 'filter var(--dur-base) var(--ease-out)',
      }}
    >
      {colors.map((c, i) => (
        <div
          key={i}
          style={{
            background: c,
            borderRight:
              i < colors.length - 1 ? '1px solid rgba(0,0,0,0.35)' : 'none',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.18),' +
              'inset 0 -2px 0 rgba(0,0,0,0.25)',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              width: 3,
              height: 3,
              background: 'rgba(255,255,255,0.14)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 7,
              right: 9,
              width: 2,
              height: 2,
              background: 'rgba(0,0,0,0.35)',
            }}
          />
        </div>
      ))}
      {saturate && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '35%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
            animation: 'palette-sweep 1.4s ease-out',
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: 'var(--border)',
        }}
      />
    </div>
  )
}

/* ── Pills ───────────────────────────────────────────────────────────────── */

function Pill({
  children,
  icon,
}: {
  children: ReactNode
  icon?: 'biome'
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-pill)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {icon === 'biome' && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2l3 6 6 1-4.5 4.5 1 6L12 17l-5.5 2.5 1-6L3 9l6-1 3-6z" />
        </svg>
      )}
      {children}
    </span>
  )
}

function DifficultyPill({ difficulty }: { difficulty: DifficultyDisplay }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 8px',
        background: `${difficulty.tone}15`,
        border: `1px solid ${difficulty.tone}55`,
        borderRadius: 'var(--r-pill)',
        color: difficulty.tone,
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ display: 'inline-flex', gap: 1 }} aria-hidden="true">
        {Array.from({ length: difficulty.swords }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 2,
              height: 9,
              background: difficulty.tone,
              boxShadow: `0 0 4px ${difficulty.tone}`,
            }}
          />
        ))}
      </span>
      {difficulty.label}
    </span>
  )
}

/* ── Stat line ───────────────────────────────────────────────────────────── */

function StatLine({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        minHeight: 18,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 88,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--text-primary)' }}>{children}</span>
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */

function StartButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '14px 18px',
        background: hov ? 'var(--accent-hover)' : 'var(--btn-primary-bg)',
        color: 'var(--btn-primary-text)',
        border: 'none',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: 'var(--tracking-display)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: hov
          ? 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.28), 0 0 22px var(--accent-glow)'
          : 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.28), 0 2px 0 rgba(0,0,0,0.35)',
        transition: 'all var(--dur-fast) var(--ease-out)',
        overflow: 'hidden',
      }}
    >
      <span>Start Project</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          transform: hov ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform var(--dur-fast) var(--ease-out)',
        }}
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  )
}

function SaveButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 14px',
        background: hov ? 'var(--bg-hover)' : 'transparent',
        color: hov ? 'var(--text-primary)' : 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}
    >
      <span style={{ fontSize: 13 }} aria-hidden="true">💾</span>
      Save for Later
    </button>
  )
}

/* ── Corner cuts (hover flourish) ────────────────────────────────────────── */

function CornerCuts() {
  const base: CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    background: 'var(--accent)',
    zIndex: 4,
    boxShadow: '0 0 6px rgba(0,204,255,0.7)',
  }
  return (
    <>
      <span style={{ ...base, top: -1, left: -1 }} aria-hidden="true" />
      <span style={{ ...base, top: -1, right: -1 }} aria-hidden="true" />
      <span style={{ ...base, bottom: -1, left: -1 }} aria-hidden="true" />
      <span style={{ ...base, bottom: -1, right: -1 }} aria-hidden="true" />
    </>
  )
}
