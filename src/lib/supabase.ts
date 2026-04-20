/**
 * lib/supabase.ts
 *
 * Initialises the Supabase client for use throughout the app.
 * Both values are loaded from Vite env vars (VITE_* prefix makes them
 * available in the browser bundle; never put secret keys in VITE_ vars).
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase'
 *   const { data, error } = await supabase.from('builds').select('*')
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example → .env and fill in your project credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Convenience re-export of the auth namespace for use in feature hooks. */
export const auth = supabase.auth
