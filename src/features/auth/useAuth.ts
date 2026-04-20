/**
 * features/auth/useAuth.ts
 *
 * Central auth hook. On mount it subscribes to Supabase Auth state changes,
 * fetches the user's profile row, and populates the Zustand userStore.
 * Any component can call useAuth() to get the current user and auth actions.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { UserProfile } from '@/types/user'

export function useAuth() {
  const { user, setUser, clearUser } = useUserStore()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await syncProfile(session.user.id, session.user.email ?? '')
      }
    }

    void loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await syncProfile(session.user.id, session.user.email ?? '')
        } else {
          clearUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function syncProfile(authId: string, email: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authId)
      .single()

    if (profile) {
      setUser({
        id: authId,
        email,
        profile: profile as UserProfile,
      })
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    navigate('/')
  }

  async function signOut() {
    await supabase.auth.signOut()
    clearUser()
    navigate('/login')
  }

  return { user, signIn, signOut, isAuthenticated: Boolean(user) }
}
