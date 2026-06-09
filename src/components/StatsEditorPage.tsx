import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchStats, saveStats } from '../utils/supabase'
import { PlusIcon, XIcon, RefreshIcon, SaveIcon } from './Icons'

interface StatItem {
  id?: number
  value: string
  label: string
  sort_order: number
}

export function StatsEditorPage() {
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [stats, setStats] = useState<StatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [refreshTrigger])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchStats()
      setStats(data || [])
    } catch {
      addToast('Failed to load stats', 'error')
    }
    setLoading(false)
  }

  function update(i: number, field: 'label' | 'value', val: string) {
    setStats(stats.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  function remove(i: number) {
    setStats(stats.filter((_, idx) => idx !== i))
  }

  function add() {
    setStats([...stats, { value: '', label: '', sort_order: stats.length }])
  }

  async function handleSave() {
    setSaving(true)
    const items = stats
      .filter(s => s.label.trim() && s.value.trim())
      .map((s, i) => ({ value: s.value, label: s.label, sort_order: i }))
    const { error } = await saveStats(items)
    if (error) { addToast('Save failed: ' + error.message, 'error'); setSaving(false); return }
    addToast('Stats saved to database!', 'success')
    setSaving(false)
    load()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Site Statistics</h2>
          <p className="mt-0.5 text-xs dark:text-zinc-600">Edit the stats shown on the homepage (e.g. "90kg+ Waste Collected")</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50" onClick={handleSave} disabled={saving}>
            <SaveIcon size={13} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <motion.div
        className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between border-b dark:border-zinc-800/50 px-4 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">{stats.length} Stat{stats.length !== 1 ? 's' : ''}</h3>
          <button className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-400" onClick={add}>
            <PlusIcon size={12} /> Add Stat
          </button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg dark:bg-zinc-800/50" />
              ))}
            </div>
          ) : stats.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="text-sm font-medium text-zinc-500">No stats yet</div>
              <div className="text-xs dark:text-zinc-700">Click "Add Stat" to create one</div>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">{i + 1}</span>
                  <input value={s.value} onChange={e => update(i, 'value', e.target.value)} placeholder="Value (e.g. 90kg+)"
                    className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                  <input value={s.label} onChange={e => update(i, 'label', e.target.value)} placeholder="Label (e.g. Waste Collected)"
                    className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                  <button onClick={() => remove(i)}
                    className="rounded p-1.5 text-zinc-500 hover:border-red-400/50 hover:text-red-600">
                    <XIcon size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
