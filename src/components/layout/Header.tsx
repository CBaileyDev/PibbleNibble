/**
 * components/layout/Header.tsx
 *
 * Top navigation bar showing the current page title, global search
 * (placeholder), and the current user's avatar + theme indicator.
 */

import { Bell } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const user = useUserStore((s) => s.user)
  const theme = useUserStore((s) => s.theme)

  const initials = user?.profile.displayName
    ? user.profile.displayName.slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
      <h1 className="text-base font-semibold text-[var(--text-primary)]">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Theme indicator dot */}
        <span
          className="size-2 rounded-full"
          style={{
            background: theme === 'blossom' ? '#d63f7a' : '#6d83f2',
          }}
          title={`Theme: ${theme}`}
        />

        {/* Notification bell (placeholder) */}
        <button className="relative p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="size-7 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)] flex items-center justify-center">
          {user?.profile.avatarUrl ? (
            <img
              src={user.profile.avatarUrl}
              alt={user.profile.displayName}
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-[var(--accent)]">{initials}</span>
          )}
        </div>
      </div>
    </header>
  )
}
