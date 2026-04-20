/**
 * components/layout/AppShell.tsx
 *
 * Outermost shell: Sidebar (sticky left column) + scrollable main content.
 * currentRoute and user are optional — when omitted they fall back to
 * useLocation / useUserStore so the existing router setup in App.tsx
 * (which renders <AppShell /> with no props and relies on <Outlet />) keeps
 * working without changes.
 */

import { type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { Sidebar } from './Sidebar'
import styles from './AppShell.module.css'

export interface AppShellProps {
  children?: ReactNode
  currentRoute?: string
  user?: { name: string; theme: 'deepslate' | 'blossom' }
}

export function AppShell({ children, currentRoute, user }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const storeUser = useUserStore((s) => s.user)
  const storeTheme = useUserStore((s) => s.theme)

  const route = currentRoute ?? location.pathname

  const sidebarUser = user ?? {
    name: storeUser?.profile.displayName ?? 'Guest',
    theme: storeTheme,
  }

  return (
    <div className={styles.shell}>
      <div className={styles.sidebar}>
        <Sidebar
          currentRoute={route}
          user={sidebarUser}
          onNavigate={(r) => navigate(r)}
        />
      </div>

      <main className={styles.main}>
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
