/**
 * components/layout/Sidebar.tsx
 *
 * Primary navigation sidebar. Fixed left column, full viewport height.
 *
 * Driven by props (no router coupling) — the parent passes the active route
 * and receives navigation intents via onNavigate. Collapse state is owned
 * by the Zustand store so it survives reloads.
 */

import {
  LayoutDashboard,
  Wand2,
  BookOpen,
  CheckSquare,
  BarChart2,
  Bookmark,
  MapPin,
  Settings,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useUserStore } from '@/stores/userStore'
import styles from './Sidebar.module.css'

interface SidebarUser {
  name: string
  theme: 'deepslate' | 'blossom'
  avatarId?: string
}

export interface SidebarProps {
  currentRoute: string
  user: SidebarUser
  onNavigate: (route: string) => void
  onSignOut?: () => void
}

interface NavItem {
  route: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { route: '/',                label: 'Dashboard',      Icon: LayoutDashboard },
  { route: '/build-designer',  label: 'Build Designer', Icon: Wand2 },
  { route: '/my-builds',       label: 'My Builds',      Icon: BookOpen },
  { route: '/checklists',      label: 'Checklists',     Icon: CheckSquare },
  { route: '/progress',        label: 'Progress',       Icon: BarChart2 },
  { route: '/saved',           label: 'Saved',          Icon: Bookmark },
  { route: '/world-notes',     label: 'World Notes',    Icon: MapPin },
  { route: '/settings',        label: 'Settings',       Icon: Settings },
]

export function Sidebar({ currentRoute, user, onNavigate, onSignOut }: SidebarProps) {
  const collapsed = useUserStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUserStore((s) => s.setSidebarCollapsed)
  const themeDotColor = user.theme === 'blossom' ? '#E0446A' : '#00CCFF'

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      data-collapsed={collapsed}
      aria-label="Primary"
    >
      {/* ── Header: logo + collapse toggle ─────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoBlock} aria-hidden="true">
            <span className={styles.logoPixel} />
            <span className={styles.logoPixel} />
            <span className={styles.logoPixel} />
            <span className={styles.logoPixel} />
          </span>
          {!collapsed && (
            <span className={styles.logoText}>Pibble &amp; Nibble</span>
          )}
        </div>

        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <ChevronLeft
            size={16}
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--dur-base) var(--ease-out)',
            }}
          />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ route, label, Icon }) => {
          const isActive = currentRoute === route
          return (
            <button
              key={route}
              type="button"
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => onNavigate(route)}
              title={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.navIcon}>
                <Icon size={18} />
              </span>
              {!collapsed && <span className={styles.navLabel}>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* ── User section + sign out ────────────────────────────────── */}
      <div className={styles.user}>
        <Avatar id={user.avatarId} size={32} />
        {!collapsed && (
          <div className={styles.userMeta}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userTheme}>
              <span
                className={styles.themeDot}
                style={{ backgroundColor: themeDotColor }}
              />
              <span className={styles.themeLabel}>{user.theme}</span>
            </span>
          </div>
        )}
        {onSignOut && (
          <button
            type="button"
            className={styles.signOutBtn}
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  )
}
