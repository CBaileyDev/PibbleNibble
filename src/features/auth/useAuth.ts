/**
 * features/auth/useAuth.ts
 *
 * Auth hook surface. Split into two pieces:
 *
 *   • useAuthSubscription() — long-lived Supabase session listener. MUST
 *     only be mounted once, at the top of the tree (see <AuthGate/>).
 *     Populates the store on every auth state change and flips `authReady`
 *     true after the initial session probe settles.
 *
 *   • useAuth() — the consumer-facing hook. Exposes the current user plus
 *     imperative signIn/signOut helpers. Safe to call from any component
 *     (no effects, no duplicate subscriptions).
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { UserProfile } from '@/types/user'

/**
 * Mount-once auth subscription. Call this from <AuthGate/> only.
 * Mounting it elsewhere creates duplicate Supabase listeners.
 */
export function useAuthSubscription() {
  const setUser = useUserStore((s) => s.setUser)
  const clearUser = useUserStore((s) => s.clearUser)
  const setAuthReady = useUserStore((s) => s.setAuthReady)

  useEffect(() => {
    let active = true

    async function syncProfile(authId: string, email: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle()
      if (!active) return
      if (profile) {
        setUser({ id: authId, email, profile: profile as UserProfile })
      }
    }

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return
      if (session?.user) {
        await syncProfile(session.user.id, session.user.email ?? '')
      }
      if (active) setAuthReady(true)
    }

    void loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return
        if (session?.user) {
          void syncProfile(session.user.id, session.user.email ?? '')
        } else {
          clearUser()
        }
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [setUser, clearUser, setAuthReady])
}

/** Consumer-facing hook — current user plus imperative sign-in / sign-out. */
export function useAuth() {
  const user = useUserStore((s) => s.user)
  const clearUser = useUserStore((s) => s.clearUser)
  const navigate = useNavigate()

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Intentionally no navigate here — LoginPage reacts to `user` becoming
    // non-null, which happens after AuthGate's `syncProfile` populates the
    // store. Navigating here races with that write.
  }

  async function signOut() {
    await supabase.auth.signOut()
    clearUser()
    navigate('/login')
  }

  return { user, signIn, signOut, isAuthenticated: Boolean(user) }
}
