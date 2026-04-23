/**
 * pages/BuildDesigner.tsx
 *
 * The AI build generator page. Users fill in the BuildDesignerForm; on
 * submit we invoke the `generate-build` Supabase Edge Function (which runs
 * Claude server-side), then navigate to BuildResults with the returned
 * variations. The overlay stays visible until the promise settles.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wand2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { BuildDesignerForm } from '@/components/build/BuildDesignerForm'
import { BuildGeneratingOverlay, usePhaseCycler } from '@/components/ui/LoadingStates'
import { toast } from '@/components/ui/Toast'
import { generateBuilds } from '@/lib/generateBuilds'
import type { BuildDesignerInput } from '@/types/build'

/** Rough expected wall-clock for the overlay's phase cycler animation. */
const OVERLAY_PHASE_MS = 15000

export function BuildDesigner() {
  const navigate = useNavigate()
  const [generating, setGenerating] = useState(false)
  const phase = usePhaseCycler(generating, OVERLAY_PHASE_MS)
  const abortRef = useRef<AbortController | null>(null)

  // Abort any in-flight request when the page unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  async function handleSubmit(data: BuildDesignerInput) {
    if (generating) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setGenerating(true)
    try {
      const { builds, warnings } = await generateBuilds(data, {
        signal: controller.signal,
      })
      navigate('/build-results', { state: { builds, input: data, warnings } })
    } catch (err) {
      if (controller.signal.aborted) return
      const message = err instanceof Error ? err.message : 'Generation failed.'
      toast.error(message)
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setGenerating(false)
    }
  }

  return (
    <>
      <PageLayout>
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] text-[var(--accent)]">
              <Wand2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Build Designer</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Describe your dream build and let AI design it for you.
              </p>
            </div>
          </div>

          <SectionCard title="Describe Your Build">
            <BuildDesignerForm onSubmit={(data) => void handleSubmit(data)} isLoading={generating} />
          </SectionCard>

          {/* Tips */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">💡 Tips for better results</p>
            <ul className="text-xs text-[var(--text-muted)] flex flex-col gap-1 list-disc list-inside">
              <li>Mention the style (medieval, modern, cosy, futuristic)</li>
              <li>Specify if you want it survival-friendly</li>
              <li>Add biome context — e.g. "nestled in a dark forest"</li>
              <li>Include must-have features — "has a library and enchanting room"</li>
            </ul>
          </div>
        </div>
      </PageLayout>

      <BuildGeneratingOverlay isVisible={generating} phase={phase} durationMs={OVERLAY_PHASE_MS} />
    </>
  )
}
