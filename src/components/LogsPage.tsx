import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchLogs, clearLogs } from '../utils/supabase'
import { RefreshIcon, TrashIcon, ClockIcon } from './Icons'

interface LogEntry {
  id: number
  action: string
  details: string | null
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  'missions:save': 'text-emerald-600 dark:text-emerald-400',
  'missions:delete': 'text-red-600 dark:text-red-400',
  'announcements:save': 'text-emerald-600 dark:text-emerald-400',
  'announcements:delete': 'text-red-600 dark:text-red-400',
  'members:save': 'text-blue-600 dark:text-blue-400',
  'stats:save': 'text-purple-600 dark:text-purple-400',
  'partners:save': 'text-cyan-600 dark:text-cyan-400',
  'contact:delete': 'text-red-600 dark:text-red-400',
  'image:upload': 'text-amber-600 dark:text-amber-400',
  'image:delete': 'text-red-600 dark:text-red-400',
  'logs:clear': 'text-orange-600 dark:text-orange-400',
}

function actionLabel(action: string): string {
  return action.replace(/(save|delete|upload|clear)$/i, (m) => m.toUpperCase())
    .replace(':', ' — ')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function LogsPage() {
  const addToast = useStore(s => s.addToast)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchLogs(200)
      setLogs(data)
    } catch {
      addToast('Failed to load logs', 'error')
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => { load() }, [load])

  const handleClear = async () => {
    if (!confirm('Clear all activity logs? This cannot be undone.')) return
    setClearing(true)
    try {
      await clearLogs()
      setLogs([])
      addToast('Activity logs cleared', 'success')
    } catch {
      addToast('Failed to clear logs', 'error')
    }
    setClearing(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Activity Logs</h2>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">Every change made in the admin panel is recorded here</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          {logs.length > 0 && (
            <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleClear} disabled={clearing}>
              <TrashIcon size={13} /> {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center">
          <ClockIcon size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity recorded yet</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Changes made from now on will appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/30 px-4 py-3"
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className={`text-xs font-semibold tracking-wide ${ACTION_COLORS[log.action] || 'text-zinc-600 dark:text-zinc-400'}`}>
                    {actionLabel(log.action)}
                  </span>
                  {log.entity_type && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {log.entity_type}{log.entity_id ? `:${log.entity_id}` : ''}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-600 ml-auto shrink-0">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
                {log.details && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500 truncate">{log.details}</p>
                )}
                <p className="text-[10px] text-zinc-300 dark:text-zinc-700 mt-0.5">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}