import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { getEnvConfig, isProductionEnv } from '../utils/env'
import { checkDBConnection, fetchMissions, fetchMissionDetail, saveMission, fetchAnnouncements, fetchAnnouncementDetail, saveAnnouncement } from '../utils/supabase'
import { formatText } from '../utils/helpers'
import { exportBackup, importBackup } from '../utils/backup'
import {
  DownloadIcon, UploadIcon, CheckCircleIcon, AlertCircleIcon, DatabaseIcon, UserIcon,
  FileTextIcon, AlertTriangleIcon, RefreshIcon,
} from './Icons'

export function SettingsPage() {
  const addToast = useStore(s => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const env = getEnvConfig()

  useEffect(() => {
    checkDBConnection()
      .then(ok => setDbStatus(ok ? 'connected' : 'error'))
      .catch(() => setDbStatus('error'))
  }, [])

  function handleExport() {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ru-admin-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Backup exported!', 'success')
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importBackup(reader.result as string)
      addToast(result.message, result.ok ? 'success' : 'error')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const prod = isProductionEnv()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Settings</h2>
        <p className="mt-0.5 text-xs dark:text-zinc-600">Configuration and data management</p>
      </div>

      {/* Production mode banner */}
      {prod && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangleIcon size={14} className="text-amber-500 shrink-0" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            Production mode — all settings are managed through environment variables.
          </p>
        </div>
      )}

      {/* DB Status */}
      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center justify-between border-b dark:border-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <DatabaseIcon size={14} className="dark:text-zinc-400" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Database Connection</h3>
          </div>
          <button onClick={() => { setDbStatus('checking'); checkDBConnection().then(ok => setDbStatus(ok ? 'connected' : 'error')).catch(() => setDbStatus('error')) }}
            className="flex items-center gap-1 rounded-md dark:bg-zinc-800 min-h-[44px] sm:min-h-0 px-3 py-2 sm:px-2 sm:py-1 text-[9px] dark:text-zinc-500 hover:text-zinc-300"
          >
            <RefreshIcon size={10} /> Test
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              dbStatus === 'connected' ? 'bg-emerald-500/10' : dbStatus === 'error' ? 'bg-red-500/10' : 'bg-zinc-800'
            }`}>
              {dbStatus === 'connected' ? (
                <CheckCircleIcon size={16} className="text-emerald-400" />
              ) : dbStatus === 'error' ? (
                <AlertCircleIcon size={16} className="text-red-400" />
              ) : (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium dark:text-zinc-300">
                {dbStatus === 'connected' ? 'Supabase Connected' : dbStatus === 'error' ? 'Connection Error' : 'Checking...'}
              </p>
              <p className="text-[10px] dark:text-zinc-600 mt-0.5">
                {dbStatus === 'connected' ? 'All CRUD operations available' : dbStatus === 'error' ? 'Check your .env configuration' : 'Verifying connection...'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md dark:bg-zinc-800 px-2 py-1 text-[9px] font-mono dark:text-zinc-500">
              {env.SUPABASE_URL ? `${env.SUPABASE_URL.slice(0, 30)}...` : 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Login */}
      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <UserIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Authentication</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg border dark:border-emerald-800/30 dark:bg-emerald-500/5 px-3 py-2.5">
            <CheckCircleIcon size={14} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-medium dark:text-emerald-300">Server-side authentication</p>
              <p className="text-[10px] dark:text-zinc-500 mt-0.5">Credentials verified on the server via API — never exposed to the client bundle.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Config */}
      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <DatabaseIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Supabase Configuration</h3>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Project URL', value: env.SUPABASE_URL ? `${env.SUPABASE_URL.slice(0, 35)}...` : null },
            { label: 'Anon Key', value: env.SUPABASE_ANON_KEY ? `${env.SUPABASE_ANON_KEY.slice(0, 20)}...` : null },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border dark:border-zinc-800/30 dark:bg-zinc-900/20 px-3 py-2">
              <span className="text-[10px] dark:text-zinc-500">{item.label}</span>
              <span className={`text-[10px] font-mono ${item.value ? 'dark:text-zinc-400' : 'text-red-400'}`}>
                {item.value || 'Not set'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <FileTextIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Backup & Restore</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 py-2 text-xs font-medium dark:text-zinc-400 dark:hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={handleExport}>
              <DownloadIcon size={13} /> Export Backup
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 py-2 text-xs font-medium dark:text-zinc-400 dark:hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={() => fileRef.current?.click()}>
              <UploadIcon size={13} /> Import Backup
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileImport} />
            <span className="text-[10px] dark:text-zinc-700">Drafts, session, and settings as JSON</span>
          </div>
        </div>
      </div>

      {/* Data Migration */}
      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <FileTextIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Data Migration</h3>
        </div>
        <div className="p-4">
          <p className="text-[10px] dark:text-zinc-600 mb-3">Reformat all existing mission and announcement text with proper paragraph breaks.</p>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
            onClick={async () => {
              const btn = document.activeElement as HTMLButtonElement
              btn.disabled = true
              btn.textContent = 'Reformatting...'
              let updated = 0
              try {
                const missions = await fetchMissions()
                for (const m of missions) {
                  const info = await fetchMissionDetail(m.id)
                  if (!info?.detail) continue
                  const cleaned = formatText(info.detail)
                  if (cleaned !== info.detail) {
                    await saveMission(m.id, { ...info, detail: cleaned })
                    updated++
                  }
                }
                const anns = await fetchAnnouncements()
                for (const a of anns) {
                  const info = await fetchAnnouncementDetail(a.id)
                  if (!info) continue
                  const fields: Record<string, string> = {}
                  if (info.description) {
                    const cleaned = formatText(info.description)
                    if (cleaned !== info.description) fields.description = cleaned
                  }
                  if (info.importance) {
                    const cleaned = formatText(info.importance)
                    if (cleaned !== info.importance) fields.importance = cleaned
                  }
                  if (info.instructions) {
                    const cleaned = formatText(info.instructions)
                    if (cleaned !== info.instructions) fields.instructions = cleaned
                  }
                  if (Object.keys(fields).length > 0) {
                    await saveAnnouncement(a.id, { ...info, ...fields })
                    updated++
                  }
                }
                addToast(`Reformatted ${updated} items`, 'success')
              } catch {
                addToast('Migration failed', 'error')
              }
              btn.disabled = false
              btn.textContent = 'Reformat All Text'
            }}
          >
            <FileTextIcon size={12} /> Reformat All Text
          </button>
        </div>
      </div>

      <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30 px-4 py-4 text-center">
        <p className="text-[10px] dark:text-zinc-700">
          RU Club Motherland Admin Panel v1 &middot; <a href="https://github.com/VoidX3D" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">VoidX3D</a>
        </p>
      </div>
    </motion.div>
  )
}
