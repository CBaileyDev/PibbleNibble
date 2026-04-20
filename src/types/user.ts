/**
 * types/user.ts
 *
 * User profile and preferences. The `profiles` Supabase table extends
 * Supabase Auth's auth.users with display name, avatar, and theme choice.
 */

/** Which visual theme a user has selected. */
export type Theme = 'deepslate' | 'blossom'

/** A user's persisted profile row in the `profiles` table. */
export interface UserProfile {
  id: string
  /** Matches auth.users.id — foreign key. */
  authId: string
  displayName: string
  /** In-game username for display in the UI. */
  minecraftUsername?: string
  avatarUrl?: string
  theme: Theme
  createdAt: string
  updatedAt: string
}

/** Lightweight shape used in the Zustand userStore. */
export interface SessionUser {
  id: string
  email: string
  profile: UserProfile
}
