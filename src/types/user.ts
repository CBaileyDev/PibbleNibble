/**
 * types/user.ts
 *
 * User profile and preferences. The `profiles` Supabase table extends
 * Supabase Auth's auth.users with display name, avatar, and theme choice.
 */

/** Which visual theme a user has selected. */
export type Theme = 'deepslate' | 'blossom'

/**
 * User-controlled behaviour toggles. Stored as a JSONB column on the
 * `profiles` table so new keys can be added without a migration.
 */
export interface UserPreferences {
  /** Show per-step material quantities in the step checklist. */
  showQuantities: boolean
  /** Auto-advance to the next step when the current one is checked. */
  autoAdvance: boolean
  /** Show AI tips and warnings inside step cards. */
  showTips: boolean
  /** Default difficulty selected in the Build Designer. */
  defaultDifficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
  /** Default footprint size selected in the Build Designer. */
  defaultBuildSize: 'small' | 'medium' | 'large' | 'epic'
}

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
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

/** Sensible defaults used when a profile has no preferences row yet. */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  showQuantities: true,
  autoAdvance: false,
  showTips: true,
  defaultDifficulty: 'medium',
  defaultBuildSize: 'medium',
}

/** Lightweight shape used in the Zustand userStore. */
export interface SessionUser {
  id: string
  email: string
  profile: UserProfile
}
