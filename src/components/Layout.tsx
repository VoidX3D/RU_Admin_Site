import { ReactNode, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring', damping: 25, stiffness: 250 } },
  closed: { x: '-100%', transition: { type: 'spring', damping: 25, stiffness: 250 } },
}

const navItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.2, delay: i * 0.03 },
  }),
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3.5">
        <motion.img
          src="/logo_icon.png"
          alt="RU Club"
          className="h-8 w-8 shrink-0 rounded-lg"
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold leading-tight tracking-tight">RU Club Motherland</div>
          <div className="text-[10px] font-medium text-[var(--text-tertiary)]">Admin Panel</div>
        </div>
        <motion.button
          className="btn btn-ghost btn-icon sidebar-close"
          onClick={() => setMobileOpen(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <XIcon size={16} />
        </motion.button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="sidebar-section">Navigation</div>
        {NAV.map((item, i) => (
          <motion.button
            key={item.id}
            custom={i}
            variants={navItemVariants}
            initial="hidden"
            animate="visible"
            className={`sidebar-item${view === item.id ? ' active' : ''}`}
            onClick={() => { setView(item.id); setMobileOpen(false) }}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </motion.button>
        ))}

        <div className="sidebar-section" style={{ marginTop: 20 }}>Actions</div>
        <motion.button
          className="sidebar-item"
          onClick={() => { setPrOpen(true); setMobileOpen(false) }}
          style={{ color: 'var(--accent)' }}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="sidebar-item-icon" style={{ color: 'var(--accent)' }}>
            <GitPullRequestIcon size={18} />
          </span>
          Publish Changes
        </motion.button>
      </nav>

      <div className="border-t border-[var(--border)] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <motion.img
            src="/logo_icon.png"
            alt="RU Club"
            className="h-7 w-7 shrink-0 rounded-md"
            whileHover={{ scale: 1.05 }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold leading-tight">Administrator</div>
            <div className="text-[11px] text-[var(--text-tertiary)]">Admin Access</div>
          </div>
          <motion.button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
          </motion.button>
          <motion.button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={logout}
            title="Sign Out"
            whileHover={{ scale: 1.1, color: 'var(--red)' }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOutIcon size={14} />
          </motion.button>
        </div>
        <div className="mt-2 border-t border-[var(--border-light)] pt-2 text-center text-[10px] text-[var(--text-tertiary)]">
          RU Club Motherland Admin &middot; Sincee Bhattarai
        </div>
      </div>
    </div>
  )

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex app-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-[100] h-full w-[260px] border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="app-main">
        <header className="app-header">
          <motion.button
            className="btn btn-ghost btn-icon md:hidden"
            onClick={() => setMobileOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MenuIcon size={20} />
          </motion.button>
          <h1 className="flex-1 text-base font-bold tracking-tight">
            {PAGE_TITLES[view] ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="h-[7px] w-[7px] rounded-full bg-[var(--accent)]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Live</span>
          </div>
          <motion.button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => { triggerRefresh(); addToast('Refreshing data...', 'info') }}
            title="Sync data from GitHub"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <RefreshIcon size={14} />
          </motion.button>
          <motion.button
            className="btn btn-primary btn-sm"
            onClick={() => setPrOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <GitPullRequestIcon size={14} />
            Publish
          </motion.button>
        </header>

        <main className="app-body">
          {children}
        </main>
      </div>
    </div>
  )
}
