/**
 * components/instructions/StepCard.tsx
 *
 * A single build step with three visual states:
 *   - upcoming  : collapsed — just the numbered circle + title
 *   - current   : expanded — gradient surface, pulse-ring, tip/warning boxes,
 *                 materials-used chip row, and a primary "Mark Complete" CTA
 *   - completed : grayed + strike-through; keeps the materials chip row muted
 */

import type { BuildStep, StepBlockUsage } from '@/types/build'
import { getBlockPalette } from '@/lib/blockPalette'

type StepState = 'upcoming' | 'current' | 'completed'

interface StepCardProps {
  step: BuildStep
  state: StepState
  onComplete: () => void
}

export function StepCard({ step, state, onComplete }: StepCardProps) {
  const isCurrent = state === 'current'
  const isDone = state === 'completed'
  const isUpcoming = state === 'upcoming'

  return (
    <article
      data-step-id={step.stepId}
      style={{
        display: 'flex',
        gap: 16,
        padding: isCurrent ? '20px 22px' : '16px 18px',
        background: isCurrent
          ? 'linear-gradient(180deg, rgba(0,204,255,0.06) 0%, rgba(0,204,255,0.02) 100%), var(--bg-card)'
          : isDone
            ? 'rgba(13,18,25,0.6)'
            : 'var(--bg-card)',
        border: `1.5px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        boxShadow: isCurrent
          ? '0 0 0 1px rgba(0,204,255,0.25), 0 12px 32px rgba(0,0,0,0.5)'
          : 'var(--shadow-sm)',
        opacity: isDone ? 0.72 : 1,
        position: 'relative',
      }}
    >
      <StepNumber num={step.stepNumber} state={state} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <StepHeader step={step} state={state} />

        {!isUpcoming && (
          <p
            style={{
              margin: 0,
              fontSize: isCurrent ? 15 : 14,
              lineHeight: 1.6,
              color: isDone ? 'var(--text-muted)' : 'var(--text-secondary)',
              textDecoration: isDone ? 'line-through' : 'none',
              textDecorationColor: 'rgba(107,136,170,0.25)',
            }}
          >
            {step.description}
          </p>
        )}

        {!isUpcoming && step.blocksUsed.length > 0 && (
          <MaterialsRow blocks={step.blocksUsed} muted={isDone} />
        )}

        {isCurrent && step.tip && <TipBox>{step.tip}</TipBox>}
        {isCurrent && step.warning && <WarningBox>{step.warning}</WarningBox>}
        {!isUpcoming && step.isCheckpoint && <CheckpointChip done={isDone} />}

        {isCurrent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <MarkCompleteButton onClick={onComplete} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {step.approximateArea}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}

function StepNumber({ num, state }: { num: number; state: StepState }) {
  const isDone = state === 'completed'
  const isCurrent = state === 'current'
  const isUpcoming = state === 'upcoming'

  return (
    <div style={{ flexShrink: 0, paddingTop: 2 }}>
      <div
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDone
            ? 'var(--success)'
            : isCurrent
              ? 'var(--accent)'
              : 'transparent',
          border: isUpcoming ? '1.5px solid var(--border-strong)' : 'none',
          borderRadius: 'var(--r-sm)',
          color: isDone || isCurrent ? 'var(--text-inverse)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 700,
          boxShadow:
            isDone || isCurrent
              ? 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.3)'
              : 'none',
        }}
      >
        {isDone ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          String(num).padStart(2, '0')
        )}
      </div>
    </div>
  )
}

function StepHeader({ step, state }: { step: BuildStep; state: StepState }) {
  const isCurrent = state === 'current'
  const isDone = state === 'completed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Step {String(step.stepNumber).padStart(2, '0')}
        {isCurrent && ' · Active'}
      </span>
      <h3
        style={{
          margin: 0,
          fontFamily: isCurrent ? 'var(--font-display)' : 'var(--font-body)',
          fontWeight: isCurrent ? 700 : 600,
          fontSize: isCurrent ? 20 : 15,
          letterSpacing: isCurrent ? '0.04em' : 0,
          color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
          lineHeight: 1.3,
          textDecoration: isDone ? 'line-through' : 'none',
          textDecorationColor: 'rgba(107,136,170,0.35)',
        }}
      >
        {step.title}
      </h3>
    </div>
  )
}

function MaterialsRow({ blocks, muted }: { blocks: StepBlockUsage[]; muted: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
      {blocks.map((b) => (
        <MaterialChip key={b.blockId} block={b} muted={muted} />
      ))}
    </div>
  )
}

function MaterialChip({ block, muted }: { block: StepBlockUsage; muted: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 8px 4px 4px',
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        fontSize: 12,
        fontWeight: 500,
        color: muted ? 'var(--text-muted)' : 'var(--text-secondary)',
      }}
    >
      <BlockSwatch blockId={block.blockId} size={16} />
      <span style={{ color: muted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
        {block.blockName}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: muted ? 'var(--text-muted)' : 'var(--accent)',
        }}
      >
        ×{block.quantity}
      </span>
    </span>
  )
}

export function BlockSwatch({ blockId, size = 18 }: { blockId: string; size?: number }) {
  const { c1, c2 } = getBlockPalette(blockId)
  const px = Math.max(1, Math.round(size / 8))
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        background: c1,
        position: 'relative',
        flexShrink: 0,
        boxShadow:
          `inset 0 ${px}px 0 rgba(255,255,255,0.18),` +
          `inset 0 -${px}px 0 rgba(0,0,0,0.30),` +
          `inset ${px}px 0 0 rgba(255,255,255,0.06),` +
          `inset -${px}px 0 0 rgba(0,0,0,0.18)`,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: px * 2,
          left: px * 2,
          width: px,
          height: px,
          background: c2,
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: px * 2,
          right: px * 2,
          width: px,
          height: px,
          background: c2,
        }}
      />
    </span>
  )
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        background: 'rgba(34, 212, 90, 0.07)',
        border: '1px solid rgba(34, 212, 90, 0.25)',
        borderLeft: '3px solid var(--success)',
        borderRadius: 'var(--r-sm)',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1.4 }}>💡</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--success)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Tip
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
          {children}
        </span>
      </div>
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        background: 'rgba(255, 176, 32, 0.07)',
        border: '1px solid rgba(255, 176, 32, 0.28)',
        borderLeft: '3px solid var(--warning)',
        borderRadius: 'var(--r-sm)',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1.4 }}>⚠️</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--warning)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Watch out
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
          {children}
        </span>
      </div>
    </div>
  )
}

function CheckpointChip({ done }: { done: boolean }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        padding: '5px 10px',
        background: done ? 'var(--bg-elevated)' : 'rgba(0, 204, 255, 0.08)',
        border: `1px dashed ${done ? 'var(--border-strong)' : 'rgba(0,204,255,0.4)'}`,
        borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: done ? 'var(--text-muted)' : 'var(--accent)',
      }}
    >
      <span aria-hidden>🏁</span>
      Checkpoint · Good place to break
    </div>
  )
}

function MarkCompleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 18px',
        background: 'var(--btn-primary-bg)',
        color: 'var(--btn-primary-text)',
        border: 'none',
        borderRadius: 'var(--r-sm)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 'var(--tracking-display, 0.12em)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.35)',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out, ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--accent-hover)'
        e.currentTarget.style.boxShadow =
          'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.3), 0 0 20px rgba(0,204,255,0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--btn-primary-bg)'
        e.currentTarget.style.boxShadow =
          'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.35)'
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Mark Complete
    </button>
  )
}
