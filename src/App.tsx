/**
 * App.tsx
 *
 * Root component. Defines the React Router tree:
 * - <AuthGate/> wraps every route so the Supabase auth subscription lives
 *   for the whole session (it renders a splash while the initial session
 *   probe is in flight).
 * - /login is public.
 * - Everything else is protected by <RequireAuth/>, which reads the user
 *   from the Zustand store. By the time we get here, AuthGate has already
 *   resolved the session, so the user check is safe.
 */

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthGate } from '@/components/layout/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { Dashboard } from '@/pages/Dashboard'
import { BuildDesigner } from '@/pages/BuildDesigner'
import { BuildResults } from '@/pages/BuildResults'
import { BuildDetail } from '@/pages/BuildDetail'
import { SavedBuilds } from '@/pages/SavedBuilds'
import { Progress } from '@/pages/Progress'
import { WorldNotes } from '@/pages/WorldNotes'
import { Settings } from '@/pages/Settings'
import { useUserStore } from '@/stores/userStore'

/** Wraps protected routes — bounces unauthenticated users to /login. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    element: <AuthGate />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/',
        element: (
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        ),
        children: [
          { index: true,            element: <Dashboard /> },
          { path: 'build-designer', element: <BuildDesigner /> },
          { path: 'build-results',  element: <BuildResults /> },
          { path: 'builds/:id',     element: <BuildDetail /> },
          { path: 'my-builds',      element: <SavedBuilds /> },
          { path: 'checklists',     element: <SavedBuilds /> },
          { path: 'saved',          element: <SavedBuilds /> },
          { path: 'saved-builds',   element: <SavedBuilds /> },
          { path: 'progress',       element: <Progress /> },
          { path: 'world-notes',    element: <WorldNotes /> },
          { path: 'settings',       element: <Settings /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
