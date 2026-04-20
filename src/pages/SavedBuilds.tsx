/**
 * pages/SavedBuilds.tsx
 *
 * Browsable library of all saved builds. Delegates rendering to BuildLibrary.
 */

import { Link } from 'react-router-dom'
import { Wand2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { BuildLibrary } from '@/features/library/BuildLibrary'

export function SavedBuilds() {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Saved Builds</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">All your design library in one place.</p>
          </div>
          <Link to="/build-designer">
            <Button leftIcon={<Wand2 size={15} />} size="sm">
              New Build
            </Button>
          </Link>
        </div>
        <BuildLibrary />
      </div>
    </PageLayout>
  )
}
