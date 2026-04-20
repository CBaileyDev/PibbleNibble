import type { ReactNode } from 'react'

interface PaletteStripProps {
  colors: string[]
  height?: number
  overlay?: ReactNode
}

export function PaletteStrip({ colors, height = 30, overlay }: PaletteStripProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${colors.length}, 1fr)`,
        height,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {colors.map((c, i) => (
        <div
          key={i}
          style={{
            background: c,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.25)',
          }}
        />
      ))}
      {overlay && (
        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
          {overlay}
        </div>
      )}
    </div>
  )
}
