/**
 * components/ui/Toast.tsx
 *
 * Re-exports the Sonner <Toaster> with Pibble & Nibble theme defaults
 * and exposes a typed `toast` helper used throughout the app.
 *
 * Place <AppToaster /> once in AppShell. Then call toast.success(...)
 * or toast.error(...) from anywhere — no prop drilling.
 */

import { Toaster, toast as sonnerToast } from 'sonner'
import { useUserStore } from '@/stores/userStore'

/** Drop this once inside AppShell.tsx */
export function AppToaster() {
  const theme = useUserStore((s) => s.theme)

  return (
    <Toaster
      position="bottom-right"
      theme={theme === 'blossom' ? 'light' : 'dark'}
      toastOptions={{
        style: {
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        },
      }}
    />
  )
}

/** Typed toast helper — import this instead of sonner directly. */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error:   (message: string) => sonnerToast.error(message),
  info:    (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
