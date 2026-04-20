/**
 * lib/theme.ts
 *
 * Core theme primitives: type, config shape, and localStorage helpers.
 * The localStorage key (`pibble-theme`) is intentionally separate from
 * the Zustand persist key (`pibble-user`) so this module is self-contained.
 */

export type Theme = 'deepslate' | 'blossom'

export interface ThemeConfig {
  id: Theme
  label: string
  subtitle: string
  /** Four representative swatches rendered in the ThemeSwitcher card. */
  swatches: [string, string, string, string]
}

export const THEMES: Record<Theme, ThemeConfig> = {
  deepslate: {
    id: 'deepslate',
    label: 'Deepslate',
    subtitle: 'Dark & Moody',
    swatches: ['#070A0F', '#131A26', '#00CCFF', '#E2ECFF'],
  },
  blossom: {
    id: 'blossom',
    label: 'Blossom',
    subtitle: 'Soft & Cozy',
    swatches: ['#FDF1F4', '#F8E4EC', '#E0446A', '#3C1A27'],
  },
}

const STORAGE_KEY = 'pibble-theme'

export function getThemeFromStorage(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'deepslate' || stored === 'blossom') return stored
  } catch {
    // localStorage unavailable (SSR / private mode)
  }
  return 'deepslate'
}

export function saveThemeToStorage(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}
