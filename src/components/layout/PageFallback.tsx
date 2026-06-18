/**
 * components/layout/PageFallback.tsx
 *
 * Suspense fallback shown while a lazily-loaded route chunk is fetched.
 * Intentionally minimal — a centered, theme-aware spinner that announces
 * itself politely to assistive tech.
 */

export function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        color: 'var(--text-muted)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          display: 'inline-block',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  )
}
