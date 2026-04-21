/**
 * pages/Settings.tsx
 *
 * Player settings — appearance, profile, world notes, preferences,
 * and destructive account actions. Backed by the Supabase hooks:
 * useUserProfile and useWorldNotes.
 */

import { useEffect, useState, type CSSProperties } from 'react'
import { Trash2, ChevronDown, AlertTriangle, Download } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useWorldNotes } from '@/hooks/useWorldNotes'
import { useUserStore } from '@/stores/userStore'
import type { UserPreferences } from '@/types/user'
import type { WorldNote } from '@/types/project'

/* ─── Types & mock-free constants ────────────────────────────────────── */

interface AvatarOption {
  id: string
  letter: string
  name: string
  color: string
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'creeper',  letter: 'C', name: 'Creeper',  color: '#66BB6A' },
  { id: 'enderman', letter: 'E', name: 'Enderman', color: '#3B2A58' },
  { id: 'pig',      letter: 'P', name: 'Pig',      color: '#F7B6C8' },
  { id: 'wolf',     letter: 'W', name: 'Wolf',     color: '#C9CED3' },
  { id: 'cat',      letter: 'K', name: 'Cat',      color: '#E8954A' },
  { id: 'axolotl',  letter: 'A', name: 'Axolotl',  color: '#F2A3C7' },
  { id: 'villager', letter: 'V', name: 'Villager', color: '#A27B5C' },
  { id: 'steve',    letter: 'S', name: 'Steve',    color: '#4E7AC7' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'easy',     label: 'Easy' },
  { value: 'medium',   label: 'Medium' },
  { value: 'hard',     label: 'Hard' },
  { value: 'expert',   label: 'Expert' },
]

const BUILD_SIZE_OPTIONS = [
  { value: 'small',  label: 'Small   (≤ 16 blocks)' },
  { value: 'medium', label: 'Medium  (≤ 32 blocks)' },
  { value: 'large',  label: 'Large   (≤ 64 blocks)' },
  { value: 'epic',   label: 'Epic    (> 64 blocks)' },
]

/* ─── Inline confirm dialog ──────────────────────────────────────────── */

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export function Settings() {
  const user = useUserStore((s) => s.user)
  const { profile, updateDisplayName, updatePreferences } = useUserProfile()
  const { notes, addNote, deleteNote } = useWorldNotes()

  // Profile (local draft, synced from profile)
  const [displayName, setDisplayName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>('creeper')

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName)
      if (profile.avatarUrl) setSelectedAvatar(profile.avatarUrl)
    }
  }, [profile])

  // World notes form
  const [form, setForm] = useState({ name: '', x: '', y: '', z: '', notes: '' })

  // Preferences — mirror profile.preferences; fall back to sensible defaults.
  const prefs: UserPreferences = profile?.preferences ?? {
    showQuantities: true,
    autoAdvance: false,
    showTips: true,
    defaultDifficulty: 'medium',
    defaultBuildSize: 'medium',
  }

  // Danger zone
  const [dangerOpen, setDangerOpen] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  /* ── Handlers ─── */

  async function handleSaveProfile() {
    try {
      await updateDisplayName(displayName.trim() || 'Player')
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    }
  }

  async function handleAddNote() {
    if (!form.name.trim() || !user) return
    try {
      await addNote({
        userId: user.id,
        label: form.name.trim(),
        description: form.notes.trim() || undefined,
        x: Number(form.x) || 0,
        y: Number(form.y) || 0,
        z: Number(form.z) || 0,
        dimension: 'overworld',
        pinColor: '#6d83f2',
      })
      setForm({ name: '', x: '', y: '', z: '', notes: '' })
    } catch {
      toast.error('Failed to add note')
    }
  }

  async function handleDeleteNote(id: string) {
    try {
      await deleteNote(id)
    } catch {
      toast.error('Failed to delete note')
    }
  }

  async function handleClearProgress() {
    try {
      await Promise.all(notes.map((n: WorldNote) => deleteNote(n.id)))
      toast.success('Progress cleared')
    } catch {
      toast.error('Failed to clear progress')
    }
  }

  function handleExportBuilds() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { displayName, avatar: selectedAvatar },
      worldNotes: notes,
      preferences: prefs,
      builds: [],
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pibble-nibble-builds.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handlePrefChange(patch: Partial<UserPreferences>) {
    try {
      await updatePreferences(patch)
    } catch {
      toast.error('Failed to update preferences')
    }
  }

  /* ── Style tokens ─── */

  const monoStyle: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  }

  const dangerCardStyle: CSSProperties = {
    border: '1px solid color-mix(in oklab, var(--error) 55%, transparent)',
    background: 'color-mix(in oklab, var(--error) 6%, var(--bg-card))',
  }

  return (
    <PageLayout title="Settings" subtitle="Tune your profile, preferences, and shared world notes.">
      <div className="max-w-3xl mx-auto flex flex-col gap-5 w-full">
        {/* 1. APPEARANCE */}
        <SectionCard title="Appearance">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Each player can pick their own theme. It&rsquo;s saved to your profile.
            </p>
            <ThemeSwitcher />
          </div>
        </SectionCard>

        {/* 2. PROFILE */}
        <SectionCard title="Profile">
          <div className="flex flex-col gap-5">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <Button onClick={() => void handleSaveProfile()}>Save</Button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Avatar
              </p>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
              >
                {AVATAR_OPTIONS.map((a) => {
                  const active = selectedAvatar === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAvatar(a.id)}
                      aria-pressed={active}
                      aria-label={`${a.name} avatar`}
                      title={a.name}
                      style={{
                        background: a.color,
                        color: '#fff',
                        border: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                        boxShadow: active
                          ? '0 0 0 3px var(--accent-subtle), 0 2px 0 rgba(0,0,0,0.3)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.2)',
                        borderRadius: 'var(--r-md)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        aspectRatio: '1 / 1',
                        cursor: 'pointer',
                        transition: 'transform var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
                        fontSize: 'var(--text-lg)',
                      }}
                    >
                      {a.letter}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 3. WORLD NOTES */}
        <SectionCard
          title="World Notes"
          subtitle="Coordinates and landmarks shared between both players."
        >
          <div className="flex flex-col gap-5">
            {notes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">
                No notes yet — add one below.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-surface)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--text-primary)] text-sm">
                        {n.label}
                      </p>
                      <p className="text-xs mt-0.5" style={monoStyle}>
                        X: {n.x}   Y: {n.y}   Z: {n.z}
                      </p>
                      {n.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {n.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteNote(n.id)}
                      aria-label={`Delete ${n.label}`}
                      className="p-2 rounded-[var(--r-sm)] text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              className="flex flex-col gap-3 p-4 rounded-[var(--r-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]"
            >
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Add Note
              </p>
              <Input
                placeholder="Name (e.g. Witch Hut)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="X"
                  value={form.x}
                  onChange={(e) => setForm((f) => ({ ...f, x: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Y"
                  value={form.y}
                  onChange={(e) => setForm((f) => ({ ...f, y: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Z"
                  value={form.z}
                  onChange={(e) => setForm((f) => ({ ...f, z: e.target.value }))}
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-y"
              />
              <div className="flex justify-end">
                <Button onClick={() => void handleAddNote()} disabled={!form.name.trim() || !user}>
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 4. PREFERENCES */}
        <SectionCard title="Preferences">
          <div className="flex flex-col gap-4">
            <Toggle
              checked={prefs.showQuantities}
              onChange={(v) => void handlePrefChange({ showQuantities: v })}
              label="Show material quantities in steps"
            />
            <Toggle
              checked={prefs.autoAdvance}
              onChange={(v) => void handlePrefChange({ autoAdvance: v })}
              label="Auto-advance to next step on completion"
            />
            <Toggle
              checked={prefs.showTips}
              onChange={(v) => void handlePrefChange({ showTips: v })}
              label="Show tips and warnings"
            />
            <div className="h-px bg-[var(--border)] my-1" />
            <Select
              label="Default difficulty"
              options={DIFFICULTY_OPTIONS}
              value={prefs.defaultDifficulty}
              onChange={(e) =>
                void handlePrefChange({
                  defaultDifficulty: e.target.value as UserPreferences['defaultDifficulty'],
                })
              }
            />
            <Select
              label="Default build size"
              options={BUILD_SIZE_OPTIONS}
              value={prefs.defaultBuildSize}
              onChange={(e) =>
                void handlePrefChange({
                  defaultBuildSize: e.target.value as UserPreferences['defaultBuildSize'],
                })
              }
            />
          </div>
        </SectionCard>

        {/* 5. DANGER ZONE */}
        <section
          className="rounded-[var(--r-lg)] overflow-hidden"
          style={dangerCardStyle}
        >
          <button
            type="button"
            onClick={() => setDangerOpen((v) => !v)}
            aria-expanded={dangerOpen}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} style={{ color: 'var(--error)' }} />
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--error)' }}
              >
                Danger Zone
              </span>
            </span>
            <ChevronDown
              size={16}
              style={{
                color: 'var(--error)',
                transform: dangerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform var(--dur-fast) var(--ease-out)',
              }}
            />
          </button>

          {dangerOpen && (
            <div
              className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t"
              style={{
                borderColor: 'color-mix(in oklab, var(--error) 35%, transparent)',
              }}
            >
              <div className="flex items-center justify-between gap-3 pt-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Clear all world notes
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Removes every coordinate pin you&rsquo;ve saved.
                  </p>
                </div>
                <Button
                  variant="danger"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setConfirmClearOpen(true)}
                >
                  Clear
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Export my builds as JSON
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Downloads a snapshot of your builds and notes.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  leftIcon={<Download size={14} />}
                  onClick={handleExportBuilds}
                >
                  Export
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={confirmClearOpen}
        title="Clear all world notes?"
        message="This permanently removes every pin you&rsquo;ve saved. This action cannot be undone."
        confirmLabel="Yes, clear everything"
        onConfirm={() => void handleClearProgress()}
        onClose={() => setConfirmClearOpen(false)}
      />
    </PageLayout>
  )
}
