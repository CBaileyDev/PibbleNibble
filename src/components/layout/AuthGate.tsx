/**
 * components/layout/AuthGate.tsx
 *
 * Root layout that owns the long-lived Supabase auth subscription. Wrapping
 * every route with <AuthGate/> guarantees the subscription survives across
 * logins, logouts, and navigations — so auth state changes from other tabs
 * or expiring tokens propagate into the store.
 *
 * While the initial session probe is in flight, we render a minimal splash
 * instead of an <Outlet/>. That prevents authenticated users from being
 * bounced to /login on hard refresh (the persisted store only carries
 * theme / textured, not the session user).
 */

import { Outlet } from 'react-router-dom'
import { useAuthSubscription } from '@/features/auth/useAuth'
import { useUserStore } from '@/stores/userStore'
import { AppToaster } from '@/components/ui/Toast'

export function AuthGate() {
  useAuthSubscription()
  const authReady = useUserStore((s) => s.authReady)

  if (!authReady) {
    return (
      <>
        <div
          role="status"
          aria-live="polite"
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Loading…
        </div>
        <AppToaster />
      </>
    )
  }

  return (
    <>
      <Outlet />
      <AppToaster />
    </>
  )
}
