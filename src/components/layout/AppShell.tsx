/**
 * components/layout/AppShell.tsx
 *
 * Root shell that composes Sidebar + Header + the page content area.
 * Rendered for every authenticated route via the router outlet.
 * Also mounts the global toast container here so it's always present.
 */

import { Outlet, useMatches } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AppToaster } from '@/components/ui/Toast'

/** Map of route paths → page titles shown in the header. */
const PAGE_TITLES: Record<string, string> = {
  '/':               'Dashboard',
  '/build-designer': 'Build Designer',
  '/build-results':  'Build Results',
  '/saved-builds':   'Saved Builds',
  '/progress':       'Progress Tracker',
  '/world-notes':    'World Notes',
  '/settings':       'Settings',
}

export function AppShell() {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname ?? '/'
  const pageTitle = PAGE_TITLES[currentPath] ?? 'Pibble & Nibble'

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>

      <AppToaster />
    </div>
  )
}
