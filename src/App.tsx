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

import { lazy } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthGate } from '@/components/layout/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { useUserStore } from '@/stores/userStore'

// Pages are code-split so the initial bundle only loads the auth shell.
// Each route fetches its own chunk on first navigation (Suspense fallback
// lives in <AppShell/> around the <Outlet/>).
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const BuildDesigner = lazy(() => import('@/pages/BuildDesigner').then((m) => ({ default: m.BuildDesigner })))
const BuildResults = lazy(() => import('@/pages/BuildResults').then((m) => ({ default: m.BuildResults })))
const BuildDetail = lazy(() => import('@/pages/BuildDetail').then((m) => ({ default: m.BuildDetail })))
const SavedBuilds = lazy(() => import('@/pages/SavedBuilds').then((m) => ({ default: m.SavedBuilds })))
const Progress = lazy(() => import('@/pages/Progress').then((m) => ({ default: m.Progress })))
const WorldNotes = lazy(() => import('@/pages/WorldNotes').then((m) => ({ default: m.WorldNotes })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

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
