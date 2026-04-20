import { useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'

const NAV_TABS = [
  { id: '/',             label: 'Dashboard'    },
  { id: '/saved-builds', label: 'Saved Builds' },
  { id: '/build-designer', label: 'Generate'   },
  { id: '/settings',    label: 'Settings'      },
]

export function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const theme = useUserStore((s) => s.theme)
  const setTheme = useUserStore((s) => s.setTheme)
  const user = useUserStore((s) => s.user)

  const activeTab = NAV_TABS.find((t) =>
    t.id === '/' ? pathname === '/' : pathname.startsWith(t.id)
  )?.id ?? '/'

  const initials = user?.profile.displayName
    ? user.profile.displayName.slice(0, 2).toUpperCase()
    : 'PN'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'color-mix(in oklab, var(--bg-base) 88%, transparent)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        {/* Logo */}
        <Logo />

        <div style={{ flex: 1 }} />

        {/* Theme switch + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ThemeSwitch theme={theme} setTheme={setTheme} />
          <Avatar initials={initials} avatarUrl={user?.profile.avatarUrl} />
        </div>

        {/* Nav tabs — full width row below */}
        <nav style={{ flexBasis: '100%', order: 3 }}>
          <div className="scroll-x" style={{ paddingBottom: 2 }}>
            <div className="tabs">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => navigate(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      {/* 2×2 pixel-block logo mark */}
      <div
        style={{
          width: 34,
          height: 34,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 2,
          borderRadius: 3,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ background: 'var(--accent)' }} />
        <div style={{ background: 'var(--bg-elevated)' }} />
        <div style={{ background: 'var(--border-strong)' }} />
        <div style={{ background: 'var(--accent-hover)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, whiteSpace: 'nowrap' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
          }}
        >
          PIBBLE &amp; NIBBLE
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginTop: 3,
          }}
        >
          Companion · v0.3
        </span>
      </div>
    </div>
  )
}

function ThemeSwitch({
  theme,
  setTheme,
}: {
  theme: string
  setTheme: (t: 'deepslate' | 'blossom') => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        gap: 2,
      }}
    >
      {[
        { id: 'deepslate', label: 'Deepslate' },
        { id: 'blossom',   label: 'Blossom'   },
      ].map((t) => (
        <button
          key={t.id}
          className={`tab ${theme === t.id ? 'active' : ''}`}
          style={{ padding: '7px 12px' }}
          onClick={() => setTheme(t.id as 'deepslate' | 'blossom')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function Avatar({ initials, avatarUrl }: { initials: string; avatarUrl?: string }) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 4,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
