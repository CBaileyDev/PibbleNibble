/**
 * hooks/usePreferences.ts
 *
 * Read-only view of the authenticated user's UserPreferences. Falls back to
 * DEFAULT_USER_PREFERENCES before the profile has loaded, so callers can
 * render without flicker.
 */

import { useUserStore } from '@/stores/userStore'
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/types/user'

export function usePreferences(): UserPreferences {
  const profile = useUserStore((s) => s.user?.profile)
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...(profile?.preferences ?? {}),
  }
}
