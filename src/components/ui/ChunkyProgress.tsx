interface ChunkyProgressProps {
  value: number
  max: number
}

export function ChunkyProgress({ value, max }: ChunkyProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <div className="chunky-progress" style={{ flex: 1 }}>
        <div className="chunky-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}/{max}
      </span>
    </div>
  )
}
