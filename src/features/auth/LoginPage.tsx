/**
 * features/auth/LoginPage.tsx
 *
 * Email/password login form. Two accounts (Pibble & Nibble) each get
 * their own theme after login based on their profile row.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from './useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

const schema = z.object({
  email:    z.string().email('Enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      await signIn(values.email, values.password)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">⛏️</span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">Pibble &amp; Nibble</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Your Minecraft companion</p>
        </div>

        {/* Form */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="pibble@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full mt-1">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          Private app · Two accounts only
        </p>
      </motion.div>
    </div>
  )
}
