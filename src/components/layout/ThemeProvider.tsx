/**
 * components/layout/ThemeProvider.tsx
 *
 * Context-based theme provider. Reads theme from localStorage on mount,
 * applies data-theme="[theme]" to document.documentElement, and exposes
 * ThemeContext for the useTheme hook.
 *
 * Wrap the app root with this before first paint to avoid flash.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getThemeFromStorage,
  saveThemeToStorage,
  type Theme,
} from '@/lib/theme'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'deepslate',
  setTheme: () => undefined,
})

function applyThemeAttribute(theme: Theme) {
  if (theme === 'blossom') {
    document.documentElement.setAttribute('data-theme', 'blossom')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getThemeFromStorage())

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyThemeAttribute(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    saveThemeToStorage(next)
    applyThemeAttribute(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
