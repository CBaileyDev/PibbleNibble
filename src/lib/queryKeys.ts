/**
 * lib/queryKeys.ts
 *
 * Central registry of TanStack Query keys. Keeping them here guarantees
 * mutations and realtime invalidations hit exactly the caches consumers
 * are reading from — no drift, no stringly-typed mistakes.
 */

export const qk = {
  builds: (userId: string | undefined) =>
    ['builds', userId ?? 'anon'] as const,
  build: (id: string | undefined, userId: string | undefined) =>
    ['build', id ?? 'none', userId ?? 'anon'] as const,
  projects: (userId: string | undefined) =>
    ['projects', userId ?? 'anon'] as const,
  project: (buildId: string | undefined, userId: string | undefined) =>
    ['project', buildId ?? 'none', userId ?? 'anon'] as const,
  worldNotes: () => ['worldNotes'] as const,
  userProfile: (userId: string | undefined) =>
    ['userProfile', userId ?? 'anon'] as const,
  materialChecklist: (projectId: string | undefined) =>
    ['materialChecklist', projectId ?? 'none'] as const,
}
