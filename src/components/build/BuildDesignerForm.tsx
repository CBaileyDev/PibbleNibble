/**
 * components/build/BuildDesignerForm.tsx
 *
 * The AI build request form. Uses react-hook-form + zod for validation.
 * On submit it calls the generateBuild edge-function wrapper and
 * passes the result up via onGenerated.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wand2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { generateBuild } from '@/lib/anthropic'
import type { BuildGenerationResponse, BuildCategory, Difficulty, Edition } from '@/types/build'

const schema = z.object({
  prompt:     z.string().min(10, 'Please describe your build in at least 10 characters.').max(500),
  category:   z.enum(['house', 'farm', 'storage', 'decoration', 'redstone', 'landmark', 'underground', 'other']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  edition:    z.enum(['java', 'bedrock', 'both']),
  maxBlocks:  z.coerce.number().int().min(10).max(10000).optional(),
  styleNotes: z.string().max(200).optional(),
})

type FormValues = z.infer<typeof schema>

interface BuildDesignerFormProps {
  onGenerated: (response: BuildGenerationResponse) => void
}

const CATEGORY_OPTIONS: { value: BuildCategory; label: string }[] = [
  { value: 'house',       label: '🏠 House' },
  { value: 'farm',        label: '🌾 Farm' },
  { value: 'storage',     label: '📦 Storage' },
  { value: 'decoration',  label: '🌸 Decoration' },
  { value: 'redstone',    label: '🔴 Redstone' },
  { value: 'landmark',    label: '🏔️ Landmark' },
  { value: 'underground', label: '⛏️ Underground' },
  { value: 'other',       label: '✨ Other' },
]

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy',   label: 'Easy — casual build, few materials' },
  { value: 'medium', label: 'Medium — a weekend project' },
  { value: 'hard',   label: 'Hard — ambitious, detailed' },
  { value: 'expert', label: 'Expert — large or complex' },
]

const EDITION_OPTIONS: { value: Edition; label: string }[] = [
  { value: 'both',    label: 'Both (Java & Bedrock)' },
  { value: 'java',    label: 'Java Edition' },
  { value: 'bedrock', label: 'Bedrock Edition' },
]

export function BuildDesignerForm({ onGenerated }: BuildDesignerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category:   'house',
      difficulty: 'medium',
      edition:    'both',
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const response = await generateBuild(values)
      onGenerated(response)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Build generation failed.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="Describe your build"
        placeholder="e.g. A cosy spruce cottage with a garden, fireplace, and secret underground storage room"
        error={errors.prompt?.message}
        {...register('prompt')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...register('category')}
        />
        <Select
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          error={errors.difficulty?.message}
          {...register('difficulty')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Edition"
          options={EDITION_OPTIONS}
          error={errors.edition?.message}
          {...register('edition')}
        />
        <Input
          label="Max blocks (optional)"
          type="number"
          placeholder="e.g. 500"
          error={errors.maxBlocks?.message}
          {...register('maxBlocks')}
        />
      </div>

      <Input
        label="Style notes (optional)"
        placeholder="e.g. Medieval, no nether blocks, use warm colours"
        error={errors.styleNotes?.message}
        {...register('styleNotes')}
      />

      <Button
        type="submit"
        isLoading={isSubmitting}
        leftIcon={<Wand2 size={16} />}
        size="lg"
        className="w-full mt-2"
      >
        {isSubmitting ? 'Generating…' : 'Generate Build'}
      </Button>
    </form>
  )
}
