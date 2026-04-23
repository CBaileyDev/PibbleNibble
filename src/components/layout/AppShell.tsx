/**
 * components/layout/AppShell.tsx
 *
 * Outermost shell: Sidebar (sticky left column) + scrollable main content.
 * Reads the user from the Zustand store and wires its sign-out callback
 * through to the sidebar's logout button.
 */

import { type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { useAuth } from '@/features/auth/useAuth'
import { toast } from '@/components/ui/Toast'
import { Sidebar } from './Sidebar'
import styles from './AppShell.module.css'

export interface AppShellProps {
  children?: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const storeUser = useUserStore((s) => s.user)
  const storeTheme = useUserStore((s) => s.theme)
  const { signOut } = useAuth()

  const sidebarUser = {
    name: storeUser?.profile.displayName ?? 'Guest',
    theme: storeTheme,
    avatarId: storeUser?.profile.avatarUrl ?? undefined,
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.sidebar}>
        <Sidebar
          currentRoute={location.pathname}
          user={sidebarUser}
          onNavigate={(r) => navigate(r)}
          onSignOut={() => void handleSignOut()}
        />
      </div>

      <main className={styles.main}>
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
