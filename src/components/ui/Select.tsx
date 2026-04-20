/**
 * components/ui/Select.tsx
 *
 * Native <select> wrapper styled to match the design system.
 * Compatible with react-hook-form's register().
 */

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={[
              'w-full h-9 pl-3 pr-8 rounded-[var(--radius-md)] border appearance-none',
              'bg-[var(--surface)] text-sm text-[var(--text-primary)]',
              'transition-colors duration-150 cursor-pointer',
              error
                ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
                : 'border-[var(--border)] focus:border-[var(--accent)]',
              'focus:outline-none focus:ring-1',
              className,
            ].join(' ')}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>

        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
