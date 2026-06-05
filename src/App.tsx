import { useEffect, useRef, useState } from 'react'
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
    <>
      <Toast />
      {view === 'login' ? <Login /> : (
        <Layout>
          {view === 'dashboard' && <Dashboard />}
          {view === 'missions' && <MissionsPage />}
          {view === 'announcements' && <AnnouncementsPage />}
          {view === 'members' && <MembersPage />}
          {view === 'settings' && <SettingsPage />}
          {view === 'help' && <HelpPage />}
          {view === 'history' && <HistoryPage />}
          {view === 'draftDiff' && <DraftDiffPage />}
        </Layout>
      )}
      {view !== 'login' && <PRDialog open={prOpen} onClose={() => setPrOpen(false)} />}
    </>
  )
}
