/**
 * components/instructions/BottomNavBar.tsx
 *
 * Sticky footer for the Build Detail right-hand panel. Houses the
 * Previous / Step X of Y pill / Next navigation, plus a muted
 * "Save & Exit" escape hatch on the far right.
 */

interface BottomNavBarProps {
  currentStep: number
  totalSteps: number
  canPrevious: boolean
  canNext: boolean
  onPrevious: () => void
  onNext: () => void
  onExit: () => void
}

export function BottomNavBar({
  currentStep,
  totalSteps,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onExit,
}: BottomNavBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 24px',
        background:
          'linear-gradient(180deg, rgba(7,10,15,0.75) 0%, var(--bg-surface) 40%)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--border)',
        zIndex: 5,
      }}
    >
      <NavButton
        direction="prev"
        label="Previous"
        disabled={!canPrevious}
        onClick={onPrevious}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-pill)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          letterSpacing: '0.08em',
        }}
        aria-live="polite"
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)',
            borderRadius: 1,
          }}
        />
        <span>
          Step <span style={{ color: 'var(--accent)' }}>{currentStep}</span> of{' '}
          {totalSteps}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onExit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all var(--dur-fast, 120ms) var(--ease-out, ease)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          💾 Save &amp; Exit
        </button>

        <NavButton
          direction="next"
          label="Next Step"
          disabled={!canNext}
          onClick={onNext}
          primary
        />
      </div>
    </div>
  )
}

function NavButton({
  direction,
  label,
  disabled,
  onClick,
  primary,
}: {
  direction: 'prev' | 'next'
  label: string
  disabled: boolean
  onClick: () => void
  primary?: boolean
}) {
  const isNext = direction === 'next'

  const base = primary
    ? { bg: 'var(--accent)', color: 'var(--text-inverse)', border: 'none' }
    : { bg: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: base.bg,
        color: disabled ? 'var(--text-muted)' : base.color,
        border: base.border,
        borderRadius: 'var(--r-sm)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 'var(--tracking-display, 0.12em)',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        boxShadow: primary
          ? 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.28), 0 2px 0 rgba(0,0,0,0.3)'
          : 'none',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out, ease)',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (primary) {
          e.currentTarget.style.background = 'var(--accent-hover)'
          e.currentTarget.style.boxShadow =
            'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.28), 0 0 18px rgba(0,204,255,0.45)'
        } else {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.background = base.bg
        e.currentTarget.style.color = base.color
        if (primary) {
          e.currentTarget.style.boxShadow =
            'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.28), 0 2px 0 rgba(0,0,0,0.3)'
        }
      }}
    >
      {!isNext && <span aria-hidden>←</span>}
      {label}
      {isNext && <span aria-hidden>→</span>}
    </button>
  )
}
