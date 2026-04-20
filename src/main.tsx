/**
 * main.tsx
 *
 * Application entry point.
 * Mount order matters:
 *  1. QueryProvider   — TanStack Query context (must wrap everything that fetches)
 *  2. ThemeProvider   — reads Zustand, applies data-theme to <html> before first paint
 *  3. App             — renders the router tree
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { App } from './App'
import '@/styles/globals.css'
import '@/styles/animations.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>
)
