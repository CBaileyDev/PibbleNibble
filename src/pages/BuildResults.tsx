/**
 * pages/BuildResults.tsx
 *
 * Shown after AI generation. Displays the BuildResultCard summary and
 * the full markdown instructions. Users can save to Supabase or go back
 * to regenerate with the same form values.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { BuildResultCard } from '@/components/build/BuildResultCard'
import { BuildPreview } from '@/components/build/BuildPreview'
import { useSaveBuild } from '@/hooks/useBuilds'
import { toast } from '@/components/ui/Toast'
import { useUserStore } from '@/stores/userStore'
import type { BuildGenerationResponse } from '@/types/build'

export function BuildResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const { mutate: saveBuild, isPending } = useSaveBuild()

  const response = location.state?.response as BuildGenerationResponse | undefined

  if (!response) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-4xl">⛏️</span>
          <p className="text-[var(--text-muted)]">No build results found. Generate one first!</p>
        </div>
      </PageLayout>
    )
  }

  function handleSave() {
    if (!user || !response) return

    saveBuild(
      {
        ...response.build,
        userId: user.id,
        isFavorite: false,
      },
      {
        onSuccess: (saved) => {
          toast.success('Build saved! 🎉')
          navigate(`/builds/${saved.id}`)
        },
        onError: () => {
          toast.error('Failed to save build.')
        },
      }
    )
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <BuildResultCard
          result={response}
          onSave={handleSave}
          onRegenerate={() => navigate('/build-designer')}
          isSaving={isPending}
        />

        <SectionCard title="Full Instructions">
          <BuildPreview markdown={response.build.markdownInstructions} />
        </SectionCard>
      </div>
    </PageLayout>
  )
}
