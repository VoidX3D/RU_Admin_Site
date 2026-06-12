import { useEffect, useState, lazy, Suspense, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import { useStore } from './store'
import { Storage } from './utils/storage'
import { initAdminAnalytics, trackAdminPage } from './utils/analytics'
import { checkDBConnection } from './utils/supabase'
import { useKeyboardShortcuts, getDefaultShortcuts } from './hooks/useKeyboardShortcuts'

const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })))
const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })))
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const MissionsPage = lazy(() => import('./components/MissionsPage').then(m => ({ default: m.MissionsPage })))
const AnnouncementsPage = lazy(() => import('./components/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const MembersPage = lazy(() => import('./components/MembersPage').then(m => ({ default: m.MembersPage })))
const ContactSubmissions = lazy(() => import('./components/ContactSubmissions').then(m => ({ default: m.ContactSubmissions })))
const StatsEditorPage = lazy(() => import('./components/StatsEditorPage').then(m => ({ default: m.StatsEditorPage })))
const PartnersEditorPage = lazy(() => import('./components/PartnersEditorPage').then(m => ({ default: m.PartnersEditorPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const HelpPage = lazy(() => import('./components/HelpPage').then(m => ({ default: m.HelpPage })))
const Toast = lazy(() => import('./components/Toast').then(m => ({ default: m.Toast })))
const ErrorBoundary = lazy(() => import('./components/ErrorBoundary').then(m => ({ default: m.ErrorBoundary })))

function PageLoader() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <svg className="h-6 w-6 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" strokeWidth="3" stroke="currentColor" className="opacity-20" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" stroke="currentColor" strokeLinecap="round" />
        </svg>
        <p className="text-[10px] text-zinc-500">Loading...</p>
      </div>
    </div>
  )
}

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
  const setView = useStore(s => s.setView)
  const theme = useStore(s => s.theme)
  const setPendingAction = useStore(s => s.setPendingAction)
  const setDbConnected = useStore(s => s.setDbConnected)
  const isAuthenticated = useStore(s => s.auth.isAuthenticated)
  const [appLoading, setAppLoading] = useState(true)

  const navigate = useCallback((v: string) => setView(v as any), [setView])
  const setPending = useCallback((a: string | null) => setPendingAction(a), [setPendingAction])

  const shortcuts = getDefaultShortcuts(navigate, setPending)
  useKeyboardShortcuts(isAuthenticated ? shortcuts : [])

  useEffect(() => {
    initAdminAnalytics()

    // Restore session first
    const session = Storage.getSession()
    if (session?.user) {
      useStore.getState().login(session.user, session.rememberMe || false, session.expiresAt)
      // Only check DB if authenticated
      checkDBConnection().then(connected => {
        setDbConnected(connected)
      }).catch(() => {
        setDbConnected(false)
      })
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
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>
        <Toast />
        {view === 'login' ? <Login /> : (
          <Layout>
            <AnimatePresence mode="wait">
              <Suspense fallback={<PageLoader />}>
                <motion.div
                  key={view}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {PAGES[view] || <Dashboard />}
                </motion.div>
              </Suspense>
            </AnimatePresence>
          </Layout>
        )}
        <Analytics />
      </ErrorBoundary>
    </Suspense>
  )
}
