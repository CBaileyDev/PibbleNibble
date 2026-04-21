/**
 * components/instructions/PhaseTabBar.tsx
 *
 * Horizontal phase selector for the Build Detail right-hand pane.
 * Each tab shows its index, phase name, and "N of Total" completion
 * caption. The active tab is underlined in the accent colour; fully
 * completed phases get a small green check chip.
 */

import type { Phase } from '@/types/build'

interface PhaseTabBarProps {
  phases: Phase[]
  activePhase: number
  onSelect: (index: number) => void
  completedStepsByPhase: number[]
}

export function PhaseTabBar({
  phases,
  activePhase,
  onSelect,
  completedStepsByPhase,
}: PhaseTabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: '0 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        overflowX: 'auto',
      }}
      role="tablist"
      aria-label="Build phases"
    >
      {phases.map((phase, i) => {
        const active = i === activePhase
        const completed = completedStepsByPhase[i] ?? 0
        const total = phase.steps.length
        const isDone = total > 0 && completed >= total

        return (
          <button
            key={phase.phaseId}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              flexShrink: 0,
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              color: active
                ? 'var(--text-primary)'
                : isDone
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
              cursor: 'pointer',
              borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
              textAlign: 'left',
              transition: 'color var(--dur-fast, 120ms) var(--ease-out, ease)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {phase.phaseName}
              </span>
              {isDone && (
                <span
                  aria-hidden
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    background: 'var(--success)',
                    borderRadius: 'var(--r-xs)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-inverse)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </span>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {phase.phaseName} · {completed} of {total}
            </span>
          </button>
        )
      })}
    </div>
  )
}
