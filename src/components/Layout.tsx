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
  open: { x: 0, transition: { type: 'spring' as const, damping: 26, stiffness: 260 } },
  closed: { x: '-100%', transition: { type: 'spring' as const, damping: 26, stiffness: 260 } },
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

  function navTo(v: View) {
    setView(v)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-800/50 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
          <span className="text-xs font-bold text-emerald-400">RU</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">RU Club Motherland</div>
          <div className="text-[10px] font-medium text-zinc-500">Admin Panel</div>
        </div>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <XIcon size={15} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Navigation</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
              view === item.id
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
            onClick={() => navTo(item.id)}
          >
            <span className="flex w-4 shrink-0 items-center justify-center">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="mb-1 mt-6 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Actions</div>
        <button
          className="mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
          onClick={() => { setPrOpen(true); setMobileOpen(false) }}
        >
          <span className="flex w-4 shrink-0 items-center justify-center text-emerald-400">
            <GitPullRequestIcon size={18} />
          </span>
          Publish Changes
        </button>
      </nav>

      <div className="border-t border-zinc-800/50 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-zinc-300">Administrator</div>
            <div className="text-[10px] text-zinc-600">Admin Access</div>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <SunIcon size={13} /> : <MoonIcon size={13} />}
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
            onClick={logout}
            title="Sign Out"
          >
            <LogOutIcon size={13} />
          </button>
        </div>
        <div className="mt-2 border-t border-zinc-800/30 pt-2 text-center text-[9px] text-zinc-700">
          RU Club Motherland &middot; Sincee Bhattarai
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-zinc-800/50 md:bg-zinc-900/50 md:backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {sidebarContent}
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 h-full w-64 border-r border-zinc-800 bg-zinc-900 shadow-2xl"
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

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/80 px-4 backdrop-blur-xl">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon size={18} />
          </button>
          <h1 className="flex-1 text-sm font-semibold text-white">
            {PAGE_TITLES[view] ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-2 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-zinc-500">Live</span>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              onClick={() => { triggerRefresh(); addToast('Refreshing data...', 'info') }}
              title="Sync data from GitHub"
            >
              <RefreshIcon size={14} />
            </button>
            <button
              className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
              onClick={() => setPrOpen(true)}
            >
              <GitPullRequestIcon size={13} />
              <span className="hidden sm:inline">Publish</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
