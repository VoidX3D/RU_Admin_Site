import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Storage } from './utils/storage'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { MissionsPage } from './components/MissionsPage'
import { AnnouncementsPage } from './components/AnnouncementsPage'
import { MembersPage } from './components/MembersPage'
import { SettingsPage } from './components/SettingsPage'
import { HelpPage } from './components/HelpPage'
import { HistoryPage } from './components/HistoryPage'
import { DraftDiffPage } from './components/DraftDiffPage'
import { Toast } from './components/Toast'
import { PRDialog } from './components/PRDialog'
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
  settings: <SettingsPage />,
  help: <HelpPage />,
  history: <HistoryPage />,
  draftDiff: <DraftDiffPage />,
}

export default function App() {
  const view = useStore(s => s.view)
  const setUser = useStore(s => s.setUser)
  const setView = useStore(s => s.setView)
  const prOpen = useStore(s => s.prOpen)
  const setPrOpen = useStore(s => s.setPrOpen)
  const theme = useStore(s => s.theme)
  const setPendingAction = useStore(s => s.setPendingAction)
  const [appLoading, setAppLoading] = useState(true)

  const viewRef = useRef(view)
  viewRef.current = view
  const prRef = useRef(prOpen)
  prRef.current = prOpen

  useEffect(() => {
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
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        if (viewRef.current !== 'login') setPrOpen(true)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        setView('settings')
        return
      }

      if (e.key === 'Escape') {
        if (prRef.current) { setPrOpen(false); return }
        return
      }

      if (isInput) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case '1': e.preventDefault(); setPendingAction('newMission'); setView('missions'); break
          case '2': e.preventDefault(); setPendingAction('newAnnouncement'); setView('announcements'); break
          case 'd': e.preventDefault(); setView('dashboard'); break
          case 'm': e.preventDefault(); setView('missions'); break
          case 'a': e.preventDefault(); setView('announcements'); break
          case 'u': e.preventDefault(); setView('members'); break
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (appLoading) {
    return (
      <div className="app-loader">
        <div className="app-loader-spinner">
          <div className="spinner spinner-lg" />
        </div>
        <p className="app-loader-text">Loading Admin Panel...</p>
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
      {view !== 'login' && <PRDialog open={prOpen} onClose={() => setPrOpen(false)} />}
    </ErrorBoundary>
  )
}
