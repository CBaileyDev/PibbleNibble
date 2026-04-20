/**
 * components/ui/Input.tsx
 *
 * Styled text input compatible with react-hook-form's register().
 * Includes label, optional helper text, and error message slots.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftElement, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <span className="absolute left-3 text-[var(--text-muted)]">{leftElement}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-9 rounded-[var(--radius-md)] border bg-[var(--surface)]',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'transition-colors duration-150',
              error
                ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
                : 'border-[var(--border)] focus:border-[var(--accent)]',
              'focus:outline-none focus:ring-1',
              leftElement ? 'pl-9 pr-3' : 'px-3',
              className,
            ].join(' ')}
            {...props}
          />
        </div>

        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
