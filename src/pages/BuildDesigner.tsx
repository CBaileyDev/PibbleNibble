/**
 * pages/BuildDesigner.tsx
 *
 * The AI build generator page. Users fill in the BuildDesignerForm;
 * on success they are routed to BuildResults with the response in state.
 */

import { useNavigate } from 'react-router-dom'
import { Wand2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { BuildDesignerForm } from '@/components/build/BuildDesignerForm'
import type { BuildGenerationResponse } from '@/types/build'

export function BuildDesigner() {
  const navigate = useNavigate()

  function handleGenerated(response: BuildGenerationResponse) {
    navigate('/build-results', { state: { response } })
  }

  return (
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
          <BuildDesignerForm onGenerated={handleGenerated} />
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
  )
}
