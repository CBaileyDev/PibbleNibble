/**
 * components/ui/Toggle.tsx
 *
 * Accessible on/off toggle switch. Used for settings and checklist items.
 */

import { type ChangeEvent } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  id?: string
}

export function Toggle({ checked, onChange, label, disabled = false, id }: ToggleProps) {
  const toggleId = id ?? (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked)
  }

  return (
    <label
      htmlFor={toggleId}
      className={[
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={[
            'w-10 h-6 rounded-full border transition-colors duration-200',
            'peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]',
            'bg-[var(--surface-raised)] border-[var(--border)]',
          ].join(' ')}
        />
        <div
          className={[
            'absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </div>
      {label && (
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      )}
    </label>
  )
}
