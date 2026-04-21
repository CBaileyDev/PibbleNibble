/**
 * components/instructions/BuildProgressBar.tsx
 *
 * Chunky "blocky" progress fill for the Build Detail header. Displays the
 * current phase name, step counter, and a percentage — all with a smooth
 * width transition as steps tick off.
 */

interface BuildProgressBarProps {
  completed: number
  total: number
  currentPhase: string
}

export function BuildProgressBar({ completed, total, currentPhase }: BuildProgressBarProps) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))
  const isDone = total > 0 && completed >= total

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Overall Progress
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>
            Step {Math.min(completed + (isDone ? 0 : 1), total)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}> of {total}</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>· {pct}%</span>
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 18,
          padding: 3,
          background: 'var(--bg-base)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-xs)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background:
              `repeating-linear-gradient(90deg, var(--accent) 0 6px, color-mix(in oklab, var(--accent) 78%, #000) 6px 8px)`,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.30)',
            borderRadius: 'var(--r-xs)',
            transition: 'width var(--dur-slow, 320ms) var(--ease-out, cubic-bezier(.2,.8,.2,1))',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        <span>Current · {currentPhase || '—'}</span>
        <span>{total - completed} left</span>
      </div>
    </div>
  )
}
