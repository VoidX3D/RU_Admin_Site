import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Storage } from './utils/storage'
import { initAdminAnalytics, trackAdminPage } from './utils/analytics'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { MissionsPage } from './components/MissionsPage'
import { AnnouncementsPage } from './components/AnnouncementsPage'
import { MembersPage } from './components/MembersPage'
import { ContactSubmissions } from './components/ContactSubmissions'
import { StatsEditorPage } from './components/StatsEditorPage'
import { PartnersEditorPage } from './components/PartnersEditorPage'
import { SettingsPage } from './components/SettingsPage'
import { HelpPage } from './components/HelpPage'
import { Toast } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const PAGES: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  missions: <MissionsPage />,
  announcements: <AnnouncementsPage />,
  members: <MembersPage />,
  contact: <ContactSubmissions />,
  stats: <StatsEditorPage />,
  partners: <PartnersEditorPage />,
  settings: <SettingsPage />,
  help: <HelpPage />,
}

export default function App() {
  const view = useStore(s => s.view)
  const setUser = useStore(s => s.setUser)
  const setView = useStore(s => s.setView)
  const theme = useStore(s => s.theme)
  const setPendingAction = useStore(s => s.setPendingAction)
  const [appLoading, setAppLoading] = useState(true)

  const viewRef = useRef(view)
  viewRef.current = view

  useEffect(() => {
    initAdminAnalytics()
    const session = Storage.getSession()
    if (session?.user) {
      setUser(session.user)
      setView('dashboard')
    }
    setAppLoading(false)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (view !== 'login') {
      trackAdminPage(`/admin/${view}`, `Admin — ${view.charAt(0).toUpperCase() + view.slice(1)}`)
    }
  }, [view])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
      if (isInput) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case '1': e.preventDefault(); setPendingAction('newMission'); setView('missions'); break
          case '2': e.preventDefault(); setPendingAction('newAnnouncement'); setView('announcements'); break
          case 'd': e.preventDefault(); setView('dashboard'); break
          case 'm': e.preventDefault(); setView('missions'); break
          case 'a': e.preventDefault(); setView('announcements'); break
          case 'u': e.preventDefault(); setView('members'); break
          case 'c': e.preventDefault(); setView('contact'); break
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (appLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-full">
          <svg className="h-8 w-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" strokeWidth="3" stroke="currentColor" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-500">Loading Admin Panel...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Toast />
      {view === 'login' ? <Login /> : (
        <Layout>
          <AnimatePresence mode="wait">
              <motion.div
                key={view}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {PAGES[view] || <Dashboard />}
              </motion.div>
          </AnimatePresence>
        </Layout>
      )}
    </ErrorBoundary>
  )
}
