/**
 * App.tsx
 *
 * Root component. Defines the React Router tree:
 * - Public route: /login
 * - Protected routes: everything else, wrapped in AppShell
 *
 * Auth guard: if no user in the Zustand store, redirect to /login.
 * The useAuth hook in AppShell populates the store on mount.
 */

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
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
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true,          element: <Dashboard /> },
      { path: 'build-designer', element: <BuildDesigner /> },
      { path: 'build-results',  element: <BuildResults /> },
      { path: 'builds/:id',     element: <BuildDetail /> },
      { path: 'saved-builds',   element: <SavedBuilds /> },
      { path: 'progress',       element: <Progress /> },
      { path: 'world-notes',    element: <WorldNotes /> },
      { path: 'settings',       element: <Settings /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
