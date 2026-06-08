import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { exportBackup, importBackup } from '../utils/backup'
import { DownloadIcon, UploadIcon, CheckCircleIcon, DatabaseIcon, UserIcon, LockIcon, FileTextIcon } from './Icons'

export function SettingsPage() {
  const addToast = useStore(s => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)

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
      if (result.ok) {
        addToast(result.message, 'success')
      } else {
        addToast(result.message, 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Settings</h2>
        <p className="mt-0.5 text-xs dark:text-zinc-600">Database configuration and data management</p>
      </div>

      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <UserIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Admin Login</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Username</label>
              <div className="flex items-center gap-2">
                <input value={Storage.getSettings().username} readOnly
                  className="w-full cursor-default rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-zinc-500 opacity-70 outline-none" />
                <span className="flex shrink-0 items-center gap-1 rounded-md dark:bg-zinc-800 px-1.5 py-1 text-[9px] font-medium dark:text-zinc-500">
                  <LockIcon size={9} /> from .env
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Password</label>
              <div className="flex items-center gap-2">
                <input type="password" value={Storage.getSettings().password.replace(/./g, '•')} readOnly
                  className="w-full cursor-default rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-zinc-500 opacity-70 outline-none" />
                <span className="flex shrink-0 items-center gap-1 rounded-md dark:bg-zinc-800 px-1.5 py-1 text-[9px] font-medium dark:text-zinc-500">
                  <LockIcon size={9} /> from .env
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <DatabaseIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Supabase Database</h3>
        </div>
        <div className="p-4">
          <div className="rounded-lg border dark:border-zinc-800/30 dark:bg-zinc-900/20 p-3">
            <div className="flex items-start gap-2">
              <CheckCircleIcon size={14} className="mt-0.5 shrink-0 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-medium dark:text-zinc-300">Connected via Environment Variables</p>
                <p className="mt-1 text-[10px] dark:text-zinc-600">
                  Supabase URL and Anon Key are configured in your <code className="rounded dark:bg-zinc-800 px-1 dark:text-zinc-400">.env</code> file.
                  All data is published directly to the database.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] dark:text-zinc-700">
            <p>No GitHub token or PR workflow needed. Changes are immediate.</p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
          <FileTextIcon size={14} className="dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Data Management</h3>
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
            <span className="text-[10px] dark:text-zinc-700">All drafts and settings as JSON</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
