/**
 * providers/QueryProvider.tsx
 *
 * Wraps the app in TanStack Query's QueryClientProvider.
 * The QueryClient config is tuned for a real-time Supabase app:
 * - staleTime 60 s so lists don't re-fetch on every focus event
 * - retry 1 to avoid hammering Supabase on transient errors
 * - refetchOnWindowFocus false — Supabase Realtime subscriptions
 *   keep data fresh without polling.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
