/**
 * features/library/BuildLibrary.tsx
 *
 * Filterable, sortable grid of saved builds. Consumed by the SavedBuilds page.
 * Filters are local state only — no URL params needed for a 2-user app.
 */

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { BuildCard } from '@/components/build/BuildCard'
import { useBuilds } from '@/hooks/useBuilds'
import type { BuildCategory, Difficulty } from '@/types/build'

const CATEGORY_FILTER_OPTIONS = [
  { value: '',           label: 'All categories' },
  { value: 'house',      label: '🏠 House' },
  { value: 'farm',       label: '🌾 Farm' },
  { value: 'storage',    label: '📦 Storage' },
  { value: 'decoration', label: '🌸 Decoration' },
  { value: 'redstone',   label: '🔴 Redstone' },
  { value: 'landmark',   label: '🏔️ Landmark' },
  { value: 'underground',label: '⛏️ Underground' },
  { value: 'other',      label: '✨ Other' },
]

const DIFFICULTY_FILTER_OPTIONS = [
  { value: '',       label: 'All difficulties' },
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
  { value: 'expert', label: 'Expert' },
]

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'created_at', label: 'Date created' },
  { value: 'title',      label: 'A → Z' },
]

export function BuildLibrary() {
  const { data: builds = [], isLoading } = useBuilds()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<BuildCategory | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [sortBy, setSortBy] = useState('updated_at')

  const filtered = useMemo(() => {
    let result = [...builds]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (category) result = result.filter((b) => b.category === category)
    if (difficulty) result = result.filter((b) => b.difficulty === difficulty)

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      const aDate = sortBy === 'created_at' ? a.createdAt : a.updatedAt
      const bDate = sortBy === 'created_at' ? b.createdAt : b.updatedAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    return result
  }, [builds, search, category, difficulty, sortBy])

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search builds…"
            leftElement={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={CATEGORY_FILTER_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as BuildCategory | '')}
        />
        <Select
          options={DIFFICULTY_FILTER_OPTIONS}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
        />
        <Select
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-[var(--text-muted)]">
        {isLoading ? 'Loading…' : `${filtered.length} build${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">⛏️</span>
          <p className="text-[var(--text-muted)] text-sm">
            {search || category || difficulty
              ? 'No builds match your filters.'
              : 'No saved builds yet. Go design one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {filtered.map((build) => (
            <BuildCard key={build.id} build={build} />
          ))}
        </div>
      )}
    </div>
  )
}
