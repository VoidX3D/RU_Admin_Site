import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { getEnvConfig, isProductionEnv, hasEnvAuth } from '../utils/env'
import { exportBackup, importBackup } from '../utils/backup'
import { listAdminBranches, analyzeBranches, deleteBranch, cleanupStaleBranches } from '../utils/github'
import type { BranchStatus } from '../utils/github'
import type { Settings } from '../types'
import {
 DownloadIcon, UploadIcon, RefreshIcon, AlertTriangleIcon, CheckCircleIcon,
 SaveIcon, LockIcon, FolderIcon, BranchIcon,
 EyeIcon, EyeOffIcon, GitPullRequestIcon, TrashIcon, PlusIcon,
 UserIcon, XIcon,
} from './Icons'

export function SettingsPage() {
 const addToast = useStore(s => s.addToast)
 const settings = Storage.getSettings()
 const [repoOwner, setRepoOwner] = useState(settings.repoOwner)
 const [repoName, setRepoName] = useState(settings.repoName)
 const [repoBranch, setRepoBranch] = useState(settings.repoBranch)
 const [saved, setSaved] = useState(false)
 const fileRef = useRef<HTMLInputElement>(null)
 const env = getEnvConfig()
 const production = env.PRODUCTION_MODE
 const envAuth = hasEnvAuth()

 function save() {
 Storage.saveSettings({ ...settings, repoOwner, repoName, repoBranch })
 addToast(production ? 'Locked in production mode' : 'Repository settings saved', production ? 'warning' : 'success')
 if (!production) {
 setSaved(true)
 setTimeout(() => setSaved(false), 2500)
 }
 }

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
 const s = Storage.getSettings()
 setRepoOwner(s.repoOwner)
 setRepoName(s.repoName)
 setRepoBranch(s.repoBranch)
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
 <p className="mt-0.5 text-xs dark:text-zinc-600">Configuration, credentials, and data management</p>
 </div>

 {production && (
 <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
 <LockIcon size={16} className="mt-0.5 shrink-0 dark:text-amber-400" />
 <div className="min-w-0 text-xs leading-relaxed text-amber-300/80">
 <strong className="text-amber-300">Production Mode Active</strong> — All settings locked and read from environment variables.
 Edit your <code className="rounded dark:bg-amber-500/10 px-1 dark:text-amber-400">.env</code> file to change configuration.
 </div>
 </div>
 )}

 <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
 <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
 <UserIcon size={14} className="dark:text-zinc-400" />
 <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Login Credentials</h3>
 </div>
 <div className="p-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Username</label>
 <div className="flex items-center gap-2">
 <input value={settings.username} readOnly
 className="w-full cursor-default rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-zinc-500 opacity-70 outline-none" />
 <span className="flex shrink-0 items-center gap-1 rounded-md dark:bg-zinc-800 px-1.5 py-1 text-[9px] font-medium dark:text-zinc-500">
 <LockIcon size={9} /> from .env
 </span>
 </div>
 </div>
 <div>
 <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Password</label>
 <div className="flex items-center gap-2">
 <input type="password" value={settings.password.replace(/./g, '•')} readOnly
 className="w-full cursor-default rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-zinc-500 opacity-70 outline-none" />
 <span className="flex shrink-0 items-center gap-1 rounded-md dark:bg-zinc-800 px-1.5 py-1 text-[9px] font-medium dark:text-zinc-500">
 <LockIcon size={9} /> from .env
 </span>
 </div>
 </div>
 <div className="sm:col-span-2">
 <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Verification Code</label>
 <div className="flex items-center gap-2">
 <input value={settings.verifyCode} readOnly
 className="w-full max-w-xs cursor-default rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-zinc-500 opacity-70 outline-none" />
 <span className="flex shrink-0 items-center gap-1 rounded-md dark:bg-zinc-800 px-1.5 py-1 text-[9px] font-medium dark:text-zinc-500">
 <LockIcon size={9} /> from .env
 </span>
 </div>
 <div className="mt-1 text-[10px] dark:text-zinc-700">Required to publish PRs — always read from environment</div>
 </div>
 </div>
 </div>
 </div>

 <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
 <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
 <FolderIcon size={14} className="dark:text-zinc-400" />
 <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">GitHub Repository</h3>
 </div>
 <div className="p-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Owner</label>
 <input value={repoOwner} onChange={e => setRepoOwner(e.target.value)}
 placeholder="VoidX3D" readOnly={production}
 className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900 px-3 py-2 text-xs dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
 </div>
 <div>
 <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Repository</label>
 <input value={repoName} onChange={e => setRepoName(e.target.value)}
 placeholder="RU_Club_Website" readOnly={production}
 className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900 px-3 py-2 text-xs dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
 </div>
 <div>
 <label className="mb-1 block text-[10px] font-medium dark:text-zinc-600">Branch</label>
 <input value={repoBranch} onChange={e => setRepoBranch(e.target.value)}
 placeholder="main" readOnly={production}
 className="w-full max-w-[200px] rounded-lg border dark:border-zinc-800 dark:bg-zinc-900 px-3 py-2 text-xs dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
 </div>
 </div>
 </div>
 </div>

 <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30" style={{
 borderColor: env.GITHUB_TOKEN ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
 }}>
 <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
 {env.GITHUB_TOKEN
 ? <CheckCircleIcon size={14} className="dark:text-emerald-400" />
 : <AlertTriangleIcon size={14} className="dark:text-red-400" />
 }
 <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">GitHub Token</h3>
 </div>
 <div className="p-4">
 {env.GITHUB_TOKEN ? (
 <div className="space-y-3">
 <div className="flex items-center gap-2 text-xs dark:text-zinc-500">
 <span className="rounded-md dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium dark:text-emerald-400">Configured</span>
 <span>Token is set via environment variable</span>
 </div>
 <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
 <AlertTriangleIcon size={13} className="mt-0.5 shrink-0 dark:text-amber-400" />
 <div className="text-[10px] leading-relaxed text-amber-300/70">
 <strong className="text-amber-300">Security note:</strong> VITE_ prefixed variables are embedded in the client bundle. Anyone using the admin panel can extract this token via DevTools. Use a fine-grained PAT with minimal scopes.
 </div>
 </div>
 </div>
 ) : (
 <div className="text-xs dark:text-zinc-500">
 Add <code className="rounded dark:bg-zinc-800 px-1 py-0.5 text-[10px] dark:text-zinc-400">VITE_GITHUB_TOKEN=your_pat</code> to your <code className="rounded dark:bg-zinc-800 px-1 py-0.5 text-[10px] dark:text-zinc-400">.env</code> file to enable publishing.
 </div>
 )}
 </div>
 </div>

 <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
 <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
 <DownloadIcon size={14} className="dark:text-zinc-400" />
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

 {env.GITHUB_TOKEN && (
 <BranchManagement repoOwner={repoOwner} repoName={repoName} token={env.GITHUB_TOKEN} />
 )}

 {!production && (
 <button
 className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-500 px-4 text-xs font-semibold text-zinc-900 dark:text-white transition-colors hover:bg-blue-400"
 onClick={save}
 >
 {saved ? <CheckCircleIcon size={14} /> : <SaveIcon size={14} />}
 {saved ? 'Saved!' : 'Save Repository Settings'}
 </button>
 )}
 </motion.div>
 )
}

function BranchManagement({ repoOwner, repoName, token }: { repoOwner: string; repoName: string; token: string }) {
 const addToast = useStore(s => s.addToast)
 const [branches, setBranches] = useState<BranchStatus[]>([])
 const [loading, setLoading] = useState(true)
 const [deleting, setDeleting] = useState<string | null>(null)
 const [cleaning, setCleaning] = useState(false)

 useEffect(() => {
 if (repoOwner && repoName && token) loadBranches()
 }, [repoOwner, repoName])

 async function loadBranches() {
 setLoading(true)
 try {
 const result = await analyzeBranches(token, repoOwner, repoName, 'main')
 setBranches(result)
 } catch {
 addToast('Could not load branches', 'error')
 }
 setLoading(false)
 }

 async function handleDelete(name: string) {
 setDeleting(name)
 try {
 await deleteBranch(token, repoOwner, repoName, name)
 addToast(`Deleted branch "${name}"`, 'success')
 setBranches(p => p.filter(b => b.name !== name))
 } catch (e) {
 addToast(`Failed to delete "${name}"`, 'error')
 }
 setDeleting(null)
 }

 async function handleCleanup() {
 setCleaning(true)
 try {
 const result = await cleanupStaleBranches(token, repoOwner, repoName, 'main')
 if (result.deleted.length > 0) {
 addToast(`Cleaned up ${result.deleted.length} merged branch${result.deleted.length !== 1 ? 'es' : ''}`, 'success')
 loadBranches()
 } else {
 addToast('No merged branches to clean up', 'info')
 }
 } catch {
 addToast('Cleanup failed', 'error')
 }
 setCleaning(false)
 }

 const mergedCount = branches.filter(b => b.state === 'merged').length
 const staleCount = branches.filter(b => b.state === 'stale').length

 return (
 <div className="mb-4 rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
 <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
 <GitPullRequestIcon size={14} className="dark:text-zinc-400" />
 <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500">Branch Management</h3>
 </div>
 <div className="p-4">
 <div className="mb-3 flex items-center justify-between">
 <span className="text-xs dark:text-zinc-500">
 {loading ? 'Loading...' : `${branches.length} admin branch${branches.length !== 1 ? 'es' : ''}`}
 </span>
 <div className="flex items-center gap-1">
 <button className="flex items-center gap-1 rounded-lg border dark:border-zinc-800 px-2 py-1 text-[10px] font-medium dark:text-zinc-300 dark:hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-700" onClick={loadBranches} disabled={loading}>
 <RefreshIcon size={11} /> Refresh
 </button>
 {mergedCount > 0 && (
 <button className="flex items-center gap-1 rounded-lg border dark:border-red-800/50 px-2 py-1 text-[10px] font-medium dark:text-red-400 dark:hover:bg-red-100 dark:bg-red-500/10" onClick={handleCleanup} disabled={cleaning}>
 <TrashIcon size={11} /> Cleanup {mergedCount}
 </button>
 )}
 </div>
 </div>

 {loading ? (
 <div className="space-y-2">
 {[1,2,3].map(i => <div key={i} className="h-4 animate-pulse rounded dark:bg-zinc-800/50" style={{ width: `${60 + i * 10}%` }} />)}
 </div>
 ) : branches.length === 0 ? (
 <div className="py-4 text-center text-xs dark:text-zinc-700">No admin-update branches found</div>
 ) : (
 <div className="space-y-1">
 {branches.map(b => {
 const stateStyle = b.state === 'merged' ? 'bg-purple-100 dark:bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-600 dark:text-purple-400'
 : b.state === 'stale' ? 'bg-red-100 dark:bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
 : b.state === 'active' && b.prNumber ? 'bg-emerald-100 dark:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400'
 : 'bg-amber-100 dark:bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-600 dark:text-amber-400'
 return (
 <div key={b.name} className="flex items-center gap-2 rounded-lg dark:bg-zinc-900/50 px-3 py-2 text-xs font-mono">
 <span className="min-w-0 flex-1 truncate dark:text-zinc-400">{b.name}</span>
 <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${stateStyle}`}>
 {b.state === 'active' && b.prNumber ? `PR #${b.prNumber}` : b.state}
 </span>
 <span className="text-[10px] dark:text-zinc-700">{b.daysOld}d</span>
 {(b.state === 'stale' || b.state === 'merged') && (
 <button className="rounded p-1 dark:text-zinc-700 dark:hover:bg-red-100 dark:bg-red-500/10 hover:text-red-600 dark:text-red-400"
 onClick={() => handleDelete(b.name)} disabled={deleting === b.name}>
 {deleting === b.name ? <span className="text-[10px]">...</span> : <XIcon size={11} />}
 </button>
 )}
 </div>
 )
 })}
 </div>
 )}
 </div>
 </div>
 )
}
