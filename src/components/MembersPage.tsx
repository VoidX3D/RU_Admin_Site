import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { fetchMembers, saveMembers } from '../utils/supabase'
import type { Member, MembersData } from '../types'
import { UsersIcon, PlusIcon, XIcon, RefreshIcon, SaveIcon, DatabaseIcon } from './Icons'

type Tab = 'teachers' | 'core' | 'general'

export function MembersPage() {
 const addToast = useStore(s => s.addToast)
 const refreshTrigger = useStore(s => s.refreshTrigger)
 const [loading, setLoading] = useState(true)
 const [tab, setTab] = useState<Tab>('core')
 const [teachers, setTeachers] = useState<Member[]>([])
 const [core, setCore] = useState<Member[]>([])
 const [general, setGeneral] = useState<Member[]>([])

 useEffect(() => { load() }, [refreshTrigger])

  async function load() {
  setLoading(true)
  try {
  const d = await fetchMembers()
  if (d) {
  setTeachers(d.teachers || []); setCore(d.core || []); setGeneral(d.general || [])
  }
  } catch { /* ignore */ }
  setLoading(false)
  }

 function addMember() {
 const m: Member = { name: '', class: '', role: 'General Member' }
 if (tab === 'teachers') setTeachers(p => [...p, { ...m, role: 'Advisor', type: 'advisor' }])
 else if (tab === 'core') setCore(p => [...p, { ...m, role: 'Coordinator', type: 'coord' }])
 else setGeneral(p => [...p, m])
 }

 function upd(idx: number, field: keyof Member, val: string) {
 const fn = (arr: Member[], set: (v: Member[]) => void) => set(arr.map((m, i) => i === idx ? { ...m, [field]: val } : m))
 if (tab === 'teachers') fn(teachers, setTeachers)
 else if (tab === 'core') fn(core, setCore)
 else fn(general, setGeneral)
 }

 function remove(idx: number) {
 if (tab === 'teachers') setTeachers(p => p.filter((_, i) => i !== idx))
 else if (tab === 'core') setCore(p => p.filter((_, i) => i !== idx))
 else setGeneral(p => p.filter((_, i) => i !== idx))
 }

 function saveDraft() {
 const data: MembersData = {
 teachers: teachers.filter(t => t.name.trim()),
 core: core.filter(c => c.name.trim()),
 general: general.filter(g => g.name.trim()),
 stats: { teachers: 0, core: 0, general: 0, total: 0 },
 }
 data.stats.teachers = data.teachers.length
 data.stats.core = data.core.length
 data.stats.general = data.general.length
 data.stats.total = data.teachers.length + data.core.length + data.general.length
 Storage.saveDraft('members', 'members', data as unknown as Record<string, unknown> & MembersData)
 addToast('Members draft saved!', 'success')
 }

 const current = tab === 'teachers' ? teachers : tab === 'core' ? core : general
 const counts = { teachers: teachers.length, core: core.length, general: general.length }
 const total = teachers.length + core.length + general.length

 const TABS: { key: Tab; label: string }[] = [
 { key: 'teachers', label: 'Teachers' },
 { key: 'core', label: 'Core Team' },
 { key: 'general', label: 'General' },
 ]

 if (loading) {
 return (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="h-24 animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50" />
 ))}
 </div>
 )
 }

 return (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
 >
 <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
 <div>
  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Members</h2>
 <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">Edit teachers, core team, and general members</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200" onClick={load}>
 <RefreshIcon size={13} /> Refresh
 </button>
    <button className="flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-white hover:bg-amber-400" onClick={saveDraft}>
    <SaveIcon size={13} /> Save Draft
    </button>
    <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400" onClick={async () => {
    const filtered = { teachers: teachers.filter(t => t.name.trim()), core: core.filter(c => c.name.trim()), general: general.filter(g => g.name.trim()) }
    const stats = { teachers: filtered.teachers.length, core: filtered.core.length, general: filtered.general.length, total: filtered.teachers.length + filtered.core.length + filtered.general.length }
    const { error } = await saveMembers({ ...filtered, stats })
    if (error) { addToast('Publish failed: ' + error.message, 'error'); return }
    Storage.deleteDraft('members', 'members')
    addToast('Members published to database!', 'success')
    }}>
    <DatabaseIcon size={13} /> Publish
    </button>
 </div>
 </div>

 <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
 {[
 { count: teachers.length, label: 'Teachers', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10' },
 { count: core.length, label: 'Core Team', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10' },
 { count: general.length, label: 'General', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
 { count: total, label: 'Total', color: 'text-zinc-900 dark:text-white', bg: 'bg-zinc-200 dark:bg-zinc-800' },
 ].map((s, i) => (
 <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 text-center">
 <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
 <div className="mt-0.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-600">{s.label}</div>
 </div>
 ))}
 </div>

 <div className="mb-4 flex gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 p-1">
 {TABS.map(t => (
 <button
 key={t.key}
 className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
 tab === t.key
 ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-200'
 : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
 }`}
 onClick={() => setTab(t.key)}
 >
 {t.label}
 <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] ${
 tab === t.key ? 'bg-zinc-700 text-zinc-600 dark:text-zinc-400' : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600'
 }`}>{counts[t.key]}</span>
 </button>
 ))}
 </div>

 <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
 <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 px-4 py-3">
 <div className="flex items-center gap-2">
 <UsersIcon size={14} className="text-blue-600 dark:text-blue-400" />
 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
 {tab === 'core' ? 'Core Team' : tab === 'teachers' ? 'Teachers' : 'General Members'}
 </span>
 <span className="rounded-md bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">{current.length}</span>
 </div>
 <button className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-500 dark:hover:bg-emerald-400" onClick={addMember}>
 <PlusIcon size={12} /> Add Member
 </button>
 </div>

 <div className="p-4">
 {current.length === 0 ? (
 <div className="flex flex-col items-center gap-2 py-8">
 <UsersIcon size={24} className="text-zinc-400 dark:text-zinc-700" />
 <div className="text-sm font-medium text-zinc-500">No {tab} members yet</div>
 <div className="text-xs text-zinc-400 dark:text-zinc-700">Click "Add Member" to create one</div>
 </div>
 ) : (
 <div className="space-y-2">
 {current.map((m, i) => (
 <div key={i} className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 p-3 sm:flex-row sm:items-center">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
 {m.name.charAt(0).toUpperCase() || '?'}
 </div>
 <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
 <div>
 <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Name</label>
 <input value={m.name} onChange={e => upd(i, 'name', e.target.value)} placeholder="Full name"
 className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
 </div>
 {tab !== 'teachers' && (
 <div>
 <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Class</label>
 <input value={m.class || ''} onChange={e => upd(i, 'class', e.target.value)} placeholder="8A"
 className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
 </div>
 )}
 <div>
 <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Role</label>
 <input value={m.role} onChange={e => upd(i, 'role', e.target.value)} placeholder="Role"
 className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
 </div>
 {tab !== 'general' && (
 <div>
 <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Type</label>
 <select value={m.type || ''} onChange={e => upd(i, 'type', e.target.value)}
 className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10">
 {tab === 'teachers' ? (
 <><option value="patron">Patron</option><option value="advisor">Advisor</option></>
 ) : (
 <option value="coord">Coordinator</option>
 )}
 </select>
 </div>
 )}
 </div>
 <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-700 hover:bg-red-100 dark:bg-red-500/10 hover:text-red-600 dark:text-red-400" onClick={() => remove(i)}>
 <XIcon size={14} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )
}
