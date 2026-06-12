import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { checkDBConnection } from '../utils/supabase'

export function ConnectionStatus() {
  const dbConnected = useStore(s => s.dbConnected)
  const dbLastChecked = useStore(s => s.dbLastChecked)
  const setDbConnected = useStore(s => s.setDbConnected)
  const [checking, setChecking] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const checkRef = useRef<() => Promise<void>>()

  const isAuthenticated = useStore(s => s.auth.isAuthenticated)

  async function checkNow() {
    if (checking) return
    setChecking(true)
    try {
      const ok = await checkDBConnection()
      setDbConnected(ok)
    } catch {
      setDbConnected(false)
    }
    setChecking(false)
  }

  checkRef.current = checkNow

  useEffect(() => {
    if (!isAuthenticated) return
    checkNow()
    intervalRef.current = setInterval(() => checkRef.current?.(), 30000)
    return () => clearInterval(intervalRef.current)
  }, [isAuthenticated])

  function getTimeAgo(): string {
    if (!dbLastChecked) return ''
    const diff = Date.now() - dbLastChecked
    const secs = Math.floor(diff / 1000)
    if (secs < 10) return 'just now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}m ago`
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={checkNow}
        disabled={checking}
        className="flex items-center gap-1.5 rounded-md dark:bg-zinc-900 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title={`DB: ${dbConnected === null ? 'Checking...' : dbConnected ? 'Connected' : 'Disconnected'} — Last checked ${getTimeAgo()}. Click to refresh.`}
      >
        <div className={`h-1.5 w-1.5 rounded-full ${checking ? 'animate-pulse bg-amber-400' : dbConnected === null ? 'bg-zinc-500' : dbConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className={`text-[10px] font-medium ${checking ? 'text-amber-400' : dbConnected === null ? 'text-zinc-500' : dbConnected ? 'text-emerald-500' : 'text-red-500'}`}>
          {checking ? 'Checking...' : dbConnected === null ? '...' : dbConnected ? 'Live' : 'Offline'}
        </span>
      </button>
    </div>
  )
}
