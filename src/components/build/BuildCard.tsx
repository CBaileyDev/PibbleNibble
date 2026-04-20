import { useNavigate } from 'react-router-dom'
import { PaletteStrip } from '@/components/ui/PaletteStrip'
import { ChunkyProgress } from '@/components/ui/ChunkyProgress'
import { DiffBadge } from '@/components/ui/DiffBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { BuildDisplayData } from '@/types/display'

interface BuildCardProps {
  build: BuildDisplayData
  compact?: boolean
  onClick?: () => void
}

export function BuildCard({ build, compact = false, onClick }: BuildCardProps) {
  const navigate = useNavigate()
  const { name, palette, difficulty, progression, biome, dims, steps, status, progress } = build
  const isProgress = status === 'in-progress'
  const isCompleted = status === 'completed'

  function handleClick() {
    if (onClick) { onClick(); return }
    if (build.id && !build.id.startsWith('r') && !['mossy-oak-cottage','lantern-tower','koi-pond','deepslate-vault','cherry-bridge','obsidian-spire'].includes(build.id)) {
      navigate(`/builds/${build.id}`)
    }
  }

  const overlayBadge = status !== 'todo' ? <StatusBadge status={status} /> : undefined

  return (
    <Card
      interactive
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={handleClick}
    >
      <PaletteStrip colors={palette} height={compact ? 24 : 32} overlay={overlayBadge} />

      <div
        style={{
          padding: compact ? '14px 16px 16px' : '18px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 10 : 14,
          flex: 1,
        }}
      >
        {/* Name + badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: compact ? 17 : 22,
              lineHeight: 1.25,
              letterSpacing: '0.03em',
              color: 'var(--text-primary)',
            }}
          >
            {name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <DiffBadge level={difficulty} />
            <span className="badge badge-neutral">{progression}</span>
            {biome && !compact && <span className="badge badge-neutral">{biome}</span>}
          </div>
        </div>

        {/* Dims / steps (hidden in compact) */}
        {!compact && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            {dims} blocks · {steps} steps
          </div>
        )}

        {/* Progress bar for in-progress builds */}
        {isProgress && progress && (
          <ChunkyProgress value={progress.current} max={progress.total} />
        )}

        {/* Footer actions */}
        <div style={{ marginTop: 'auto', paddingTop: compact ? 4 : 8 }}>
          {status === 'todo' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button variant="primary" full>
                Start Project →
              </Button>
            </div>
          )}
          {isProgress && (
            <Button variant="primary" full>
              Continue →
            </Button>
          )}
          {isCompleted && (
            <Button variant="secondary" full>
              View Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
