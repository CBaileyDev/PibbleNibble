/**
 * components/layout/ThemeSwitcher.tsx
 *
 * Two side-by-side theme cards. Clicking one switches the active theme
 * immediately. The active card shows an accent-glow border and a checkmark.
 */

import { Check } from 'lucide-react'
import { THEMES, type Theme } from '@/lib/theme'
import { useTheme } from '@/hooks/useTheme'
import styles from './ThemeSwitcher.module.css'

const THEME_ORDER: Theme[] = ['deepslate', 'blossom']

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className={styles.grid}>
      {THEME_ORDER.map((id) => {
        const config = THEMES[id]
        const isActive = theme === id

        return (
          <button
            key={id}
            type="button"
            className={`${styles.card} ${isActive ? styles.active : ''}`}
            onClick={() => setTheme(id)}
            aria-pressed={isActive}
            aria-label={`Switch to ${config.label} theme`}
          >
            <div className={styles.swatchRow}>
              {config.swatches.map((color, i) => (
                <span
                  key={i}
                  className={styles.swatch}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className={styles.meta}>
              <span className={styles.label}>{config.label}</span>
              <span className={styles.subtitle}>{config.subtitle}</span>
            </div>

            {isActive && (
              <span className={styles.check} aria-hidden="true">
                <Check size={13} strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
