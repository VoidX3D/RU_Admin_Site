import { ReactNode, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type View } from '../store'
import { Storage } from '../utils/storage'
import { ConnectionStatus } from './ConnectionStatus'
import {
  TargetIcon, MegaphoneIcon, UsersIcon,
  SettingsIcon, HelpCircleIcon, MailIcon,
  MenuIcon, XIcon, LogOutIcon, RefreshIcon,
  HomeIcon, SunIcon, MoonIcon, DatabaseIcon,
  BarChartIcon, GlobeIcon, ClockIcon,
} from './Icons'

const NAV: { id: View; icon: ReactNode; label: string }[] = [
  { id: 'dashboard',     icon: <HomeIcon size={18} />,         label: 'Dashboard'     },
  { id: 'missions',      icon: <TargetIcon size={18} />,       label: 'Missions'      },
  { id: 'announcements', icon: <MegaphoneIcon size={18} />,    label: 'Announcements' },
  { id: 'members',       icon: <UsersIcon size={18} />,        label: 'Members'       },
  { id: 'stats',         icon: <BarChartIcon size={18} />,      label: 'Site Stats'    },
  { id: 'partners',      icon: <GlobeIcon size={18} />,        label: 'Partners'      },
  { id: 'contact',       icon: <MailIcon size={18} />,         label: 'Contact'       },
  { id: 'logs',          icon: <ClockIcon size={18} />,        label: 'Activity Logs' },
  { id: 'settings',      icon: <SettingsIcon size={18} />,     label: 'Settings'      },
  { id: 'help',          icon: <HelpCircleIcon size={18} />,   label: 'Help'          },
]

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  missions: 'Missions',
  announcements: 'Announcements',
  members: 'Members',
  stats: 'Site Statistics',
  partners: 'Partner Organizations',
  contact: 'Contact Submissions',
  logs: 'Activity Logs',
  settings: 'Settings',
  help: 'Help & Guide',
}

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring' as const, damping: 26, stiffness: 260 } },
  closed: { x: '-100%', transition: { type: 'spring' as const, damping: 26, stiffness: 260 } },
}

export function Layout({ children }: { children: ReactNode }) {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const logout = useStore(s => s.logout)
  const toggleTheme = useStore(s => s.toggleTheme)
  const triggerRefresh = useStore(s => s.triggerRefresh)
  const addToast = useStore(s => s.addToast)
  const updateActivity = useStore(s => s.updateActivity)
  const theme = useStore(s => s.theme)
  const dbConnected = useStore(s => s.dbConnected)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleActivity = useCallback(() => {
    updateActivity()
  }, [updateActivity])

  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000
    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('touchstart', handleActivity)
    const check = () => {
      const s = Storage.getSession()
      if (!s || (Date.now() - useStore.getState().auth.lastActivity > INACTIVITY_TIMEOUT)) {
        Storage.clearSession()
        logout()
        addToast('Session expired due to inactivity', 'info')
      }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [handleActivity, logout, addToast])

  function handleLogout() {
    Storage.clearSession()
    logout()
    addToast('Signed out successfully', 'info')
  }

  function navTo(v: View) {
    setView(v)
    setSidebarOpen(false)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3 border-b dark:border-zinc-800/50 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
          <span className="text-xs font-bold dark:text-emerald-400">RU</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">RU Club Motherland</div>
          <div className="text-[10px] font-medium text-zinc-500">Admin Panel</div>
        </div>
        <button
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7"
          onClick={() => setSidebarOpen(false)}
        >
          <XIcon size={15} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest dark:text-zinc-600">Navigation</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 min-h-[44px] sm:min-h-0 sm:py-2 text-left text-sm font-medium transition-colors ${ view === item.id ? 'bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200' }`}
            onClick={() => navTo(item.id)}
          >
            <span className="flex w-4 shrink-0 items-center justify-center">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t dark:border-zinc-800/50 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/30">
            <img src="https://github.com/VoidX3D.png" alt="VoidX3D" width="32" height="32" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium dark:text-zinc-300">RU Administration</div>
            <div className="text-[10px] dark:text-zinc-600">
              <a href="https://github.com/VoidX3D" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-zinc-400">@VoidX3D</a>
            </div>
          </div>
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-amber-400 sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <SunIcon size={13} /> : <MoonIcon size={13} />}
          </button>
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-red-400 sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOutIcon size={13} />
          </button>
        </div>
        <div className="mt-2 border-t dark:border-zinc-800/30 pt-2 text-center text-[9px] dark:text-zinc-700">
          RU Club Motherland &middot; <a href="https://github.com/VoidX3D" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">VoidX3D</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen dark:bg-zinc-950">
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 h-full w-64 border-r dark:border-zinc-800 shadow-xl dark:shadow-black/40 dark:shadow-2xl"
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
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 px-4 backdrop-blur-xl">
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8"
            onClick={() => setSidebarOpen(true)}
            title="Toggle Menu"
          >
            <MenuIcon size={18} />
          </button>
          <h1 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-white">
            {PAGE_TITLES[view] ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <button
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8"
              onClick={() => { triggerRefresh(); addToast('Refreshing data...', 'info') }}
              title="Refresh data"
            >
              <RefreshIcon size={14} />
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
