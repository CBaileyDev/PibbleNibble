/**
 * components/build/BuildCard.tsx
 *
 * Compact card shown in the Saved Builds grid. Displays title, category
 * badge, difficulty, a progress ring for material gathering, and favorite toggle.
 */

import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { computeChecklistProgress } from '@/hooks/useMaterialChecklist'
import { useToggleFavorite } from '@/hooks/useBuilds'
import type { MinecraftBuild } from '@/types/build'

interface BuildCardProps {
  build: MinecraftBuild
}

const DIFFICULTY_VARIANT = {
  easy:   'success',
  medium: 'warning',
  hard:   'danger',
  expert: 'danger',
} as const

export function BuildCard({ build }: BuildCardProps) {
  const { mutate: toggleFavorite } = useToggleFavorite()
  const progress = computeChecklistProgress(build)

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    toggleFavorite({ id: build.id, isFavorite: !build.isFavorite })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Link to={`/builds/${build.id}`}>
        <Card interactive className="flex flex-col gap-3 p-4 h-full">
          {/* Cover image placeholder */}
          <div className="rounded-[var(--radius-md)] aspect-video bg-[var(--bg-tertiary)] flex items-center justify-center text-3xl overflow-hidden">
            {build.imageUrl ? (
              <img src={build.imageUrl} alt={build.title} className="w-full h-full object-cover" />
            ) : (
              <span>⛏️</span>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
                {build.title}
              </h3>
              <button
                onClick={handleFavorite}
                className="shrink-0 p-0.5 text-[var(--text-muted)] hover:text-pink-400 transition-colors"
                aria-label={build.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  size={14}
                  className={build.isFavorite ? 'fill-pink-400 text-pink-400' : ''}
                />
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="default">{build.category}</Badge>
              <Badge variant={DIFFICULTY_VARIANT[build.difficulty]}>{build.difficulty}</Badge>
              {build.isAiGenerated && <Badge variant="accent">AI</Badge>}
            </div>

            {/* Material progress bar */}
            <div className="mt-auto pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">Materials</span>
                <span className="text-xs text-[var(--text-muted)]">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
