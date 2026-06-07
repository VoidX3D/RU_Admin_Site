import { ReactNode, useState, useEffect } from 'react'
import { useStore, type View } from '../store'
import { Storage } from '../utils/storage'
import {
  TargetIcon, MegaphoneIcon, UsersIcon,
  SettingsIcon, HelpCircleIcon, FileTextIcon,
  MenuIcon, XIcon, SunIcon, MoonIcon, LogOutIcon, RefreshIcon, GitPullRequestIcon,
  HomeIcon, ClockIcon,
} from './Icons'

const NAV: { id: View; icon: ReactNode; label: string }[] = [
  { id: 'dashboard',     icon: <HomeIcon size={18} />,         label: 'Dashboard'     },
  { id: 'missions',      icon: <TargetIcon size={18} />,       label: 'Missions'      },
  { id: 'announcements', icon: <MegaphoneIcon size={18} />,    label: 'Announcements' },
  { id: 'members',       icon: <UsersIcon size={18} />,        label: 'Members'       },
  { id: 'history',       icon: <ClockIcon size={18} />,        label: 'History'       },
  { id: 'settings',      icon: <SettingsIcon size={18} />,     label: 'Settings'      },
  { id: 'help',          icon: <HelpCircleIcon size={18} />,   label: 'Help'          },
]

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  missions: 'Missions',
  announcements: 'Announcements',
  members: 'Members',
  history: 'Publish History',
  settings: 'Settings',
  help: 'Help & Guide',
  draftDiff: 'Draft Review',
}

export function Layout({ children }: { children: ReactNode }) {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const setUser = useStore(s => s.setUser)
  const setPrOpen = useStore(s => s.setPrOpen)
  const triggerRefresh = useStore(s => s.triggerRefresh)
  const addToast = useStore(s => s.addToast)
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function logout() {
    Storage.clearSession()
    setUser(null)
    setView('login')
  }

  return (
    <div className="app-layout">
      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo_icon.png" alt="RU Club" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-logo-text">RU Club Motherland</div>
            <div className="sidebar-logo-sub">Admin Panel</div>
          </div>
          <button className="btn btn-ghost btn-icon sidebar-close" onClick={() => setMobileOpen(false)}>
            <XIcon size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Navigation</div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-item${view === item.id ? ' active' : ''}`}
              onClick={() => { setView(item.id); setMobileOpen(false) }}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="sidebar-section" style={{ marginTop: 20 }}>Actions</div>
          <button className="sidebar-item" onClick={() => { setPrOpen(true); setMobileOpen(false) }}
            style={{ color: 'var(--accent)' }}>
            <span className="sidebar-item-icon" style={{ color: 'var(--accent)' }}>
              <GitPullRequestIcon size={18} />
            </span>
            Publish Changes
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo_icon.png" alt="RU Club" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Administrator</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Admin Access</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Sign Out"
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '' }}>
              <LogOutIcon size={14} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8, borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
            RU Club Motherland Admin &middot; Sincee Bhattarai
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <button className="btn btn-ghost btn-icon menu-toggle" onClick={() => setMobileOpen(true)}>
            <MenuIcon size={20} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 700, flex: 1, letterSpacing: '-0.02em' }}>
            {PAGE_TITLES[view] ?? 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Live</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { triggerRefresh(); addToast('Refreshing data...', 'info') }} title="Sync data from GitHub">
            <RefreshIcon size={14} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setPrOpen(true)}>
            <GitPullRequestIcon size={14} />
            Publish
          </button>
        </header>

        <main className="app-body">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div className="modal-overlay" style={{ zIndex: 99, backdropFilter: 'blur(2px)' }} onClick={() => setMobileOpen(false)} />
      )}
    </div>
  )
}
