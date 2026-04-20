/**
 * components/layout/Sidebar.tsx
 *
 * Primary navigation sidebar. Collapses on mobile; always visible on desktop.
 * Nav items are defined inline to keep routing and labels co-located here.
 */

import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Wand2,
  BookOpen,
  CheckSquare,
  Map,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',               label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
  { to: '/build-designer', label: 'Build Designer', icon: <Wand2 size={18} /> },
  { to: '/saved-builds',   label: 'Saved Builds',   icon: <BookOpen size={18} /> },
  { to: '/progress',       label: 'Progress',        icon: <CheckSquare size={18} /> },
  { to: '/world-notes',    label: 'World Notes',     icon: <Map size={18} /> },
  { to: '/settings',       label: 'Settings',        icon: <Settings size={18} /> },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 60 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border-subtle)]">
        <span className="text-xl shrink-0">⛏️</span>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-semibold text-sm text-[var(--text-primary)] whitespace-nowrap"
            >
              Pibble &amp; Nibble
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-2 h-9 rounded-[var(--radius-md)] transition-colors duration-150',
                isActive
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
              ].join(' ')
            }
            title={!sidebarOpen ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <motion.span animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronLeft size={16} />
        </motion.span>
      </button>
    </motion.aside>
  )
}
