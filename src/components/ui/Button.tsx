import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  full?: boolean
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: '',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      full = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading
    const cls = [
      'btn',
      `btn-${variant}`,
      sizeClass[size],
      !children && (leftIcon || rightIcon) ? 'btn-icon' : '',
      full ? 'btn-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button ref={ref} className={cls} disabled={isDisabled} {...props}>
        {isLoading ? (
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
