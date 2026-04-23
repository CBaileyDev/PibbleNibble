import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { toast } from '@/components/ui/Toast'

const PLAYERS = [
  {
    name: 'pibble' as const,
    label: 'Pibble',
    emoji: '⛏️',
    email: import.meta.env.VITE_PIBBLE_EMAIL as string,
    password: import.meta.env.VITE_PIBBLE_PASSWORD as string,
  },
  {
    name: 'nibble' as const,
    label: 'Nibble',
    emoji: '🌸',
    email: import.meta.env.VITE_NIBBLE_EMAIL as string,
    password: import.meta.env.VITE_NIBBLE_PASSWORD as string,
  },
]

export function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<'pibble' | 'nibble' | null>(null)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSelect(player: (typeof PLAYERS)[number]) {
    if (!player.email || !player.password) {
      toast.error(`${player.label} login is not configured.`)
      return
    }

    setLoading(player.name)
    try {
      await signIn(player.email, player.password)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed.')
      setLoading(null)
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
        <div className="text-center mb-10">
          <span className="text-5xl">🏡</span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">Pibble &amp; Nibble</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Who's playing?</p>
        </div>

        <div className="flex flex-col gap-3">
          {PLAYERS.map((player) => {
            const isLoading = loading === player.name
            const isDisabled = loading !== null

            return (
              <button
                key={player.name}
                onClick={() => handleSelect(player)}
                disabled={isDisabled}
                className="flex items-center gap-4 w-full px-6 py-5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-raised)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-3xl">{player.emoji}</span>
                <span className="flex-1 text-lg font-semibold text-[var(--text-primary)]">
                  {player.label}
                </span>
                {isLoading && (
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      display: 'inline-block',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Private app · Two players only
        </p>
      </motion.div>
    </div>
  )
}
