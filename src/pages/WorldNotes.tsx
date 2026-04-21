/**
 * pages/WorldNotes.tsx
 *
 * World coordinate notes — a list of pinned locations with X/Y/Z coords.
 * Full map visualisation coming in a later sprint.
 */

import { useState } from 'react'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { useWorldNotes } from '@/hooks/useWorldNotes'
import { useUserStore } from '@/stores/userStore'
import type { WorldNote } from '@/types/project'

const DIMENSION_OPTIONS = [
  { value: 'overworld', label: '🌿 Overworld' },
  { value: 'nether',    label: '🔥 Nether' },
  { value: 'end',       label: '🌑 The End' },
]

const DIMENSION_EMOJI: Record<WorldNote['dimension'], string> = {
  overworld: '🌿',
  nether: '🔥',
  end: '🌑',
}

export function WorldNotes() {
  const user = useUserStore((s) => s.user)
  const { notes, loading, addNote, deleteNote } = useWorldNotes()
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    label: '', description: '', x: '', y: '', z: '',
    dimension: 'overworld' as WorldNote['dimension'],
    pinColor: '#6d83f2',
  })

  async function handleCreate() {
    if (!user || !form.label) return
    setIsCreating(true)
    try {
      await addNote({
        userId: user.id,
        label: form.label,
        description: form.description || undefined,
        x: Number(form.x),
        y: Number(form.y),
        z: Number(form.z),
        dimension: form.dimension,
        pinColor: form.pinColor,
      })
      toast.success('Note added!')
      setIsOpen(false)
      setForm({ label: '', description: '', x: '', y: '', z: '', dimension: 'overworld', pinColor: '#6d83f2' })
    } catch {
      toast.error('Failed to add note')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">World Notes</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Pin coordinates and notes from your world.</p>
          </div>
          <Button leftIcon={<Plus size={15} />} size="sm" onClick={() => setIsOpen(true)}>
            Add Note
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-[var(--radius-lg)] bg-[var(--surface)] animate-pulse" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📍</span>
            <p className="text-[var(--text-muted)] text-sm">No notes yet. Drop a pin to get started!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)]"
              >
                <MapPin size={16} className="shrink-0" style={{ color: note.pinColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{note.label}</p>
                    <Badge variant="muted">{DIMENSION_EMOJI[note.dimension]} {note.dimension}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    X {note.x} · Y {note.y} · Z {note.z}
                  </p>
                  {note.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{note.description}</p>
                  )}
                </div>
                <button
                  onClick={() => void deleteNote(note.id)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors rounded"
                  aria-label="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add World Note" maxWidth="sm">
          <div className="flex flex-col gap-4">
            <Input label="Label" placeholder="My base" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            <Input label="Description (optional)" placeholder="Main storage, enchanting table here" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-3 gap-2">
              <Input label="X" type="number" placeholder="0" value={form.x} onChange={(e) => setForm((f) => ({ ...f, x: e.target.value }))} />
              <Input label="Y" type="number" placeholder="64" value={form.y} onChange={(e) => setForm((f) => ({ ...f, y: e.target.value }))} />
              <Input label="Z" type="number" placeholder="0" value={form.z} onChange={(e) => setForm((f) => ({ ...f, z: e.target.value }))} />
            </div>
            <Select label="Dimension" options={DIMENSION_OPTIONS} value={form.dimension} onChange={(e) => setForm((f) => ({ ...f, dimension: e.target.value as WorldNote['dimension'] }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Pin colour</label>
              <input type="color" value={form.pinColor} onChange={(e) => setForm((f) => ({ ...f, pinColor: e.target.value }))} className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] cursor-pointer p-1" />
            </div>
            <Button onClick={() => void handleCreate()} isLoading={isCreating} className="w-full mt-1">
              Add Note
            </Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
