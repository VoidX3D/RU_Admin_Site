import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchStats, saveStats } from '../utils/supabase'
import { PlusIcon, XIcon, RefreshIcon, SaveIcon, BarChartIcon, MoveUpIcon, MoveDownIcon } from './Icons'
import { PageErrorBoundary } from './PageErrorBoundary'

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

  function update(i: number, field: 'value' | 'label', val: string) {
    setStats(stats.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  function remove(i: number) {
    setStats(stats.filter((_, idx) => idx !== i))
  }

  function moveUp(i: number) {
    if (i === 0) return
    const arr = [...stats];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    setStats(arr)
  }

  function moveDown(i: number) {
    if (i === stats.length - 1) return
    const arr = [...stats];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    setStats(arr)
  }

  function add() {
    setStats([...stats, { value: '', label: '', sort_order: stats.length }])
  }

  function validate(): boolean {
    const valid = stats.every((s, i) => {
      if (!s.label.trim()) {
        addToast(`Row ${i + 1}: Label (description) is required`, 'error')
        return false
      }
      if (!s.value.trim()) {
        addToast(`Row ${i + 1}: Value (number) is required`, 'error')
        return false
      }
      return true
    })
    if (!valid) return false
    if (stats.length === 0) {
      addToast('Add at least one stat row before saving', 'error')
      return false
    }
    return true
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    try {
      const items = stats
        .filter(s => s.label.trim() && s.value.trim())
        .map((s, i) => ({
          value: s.value.trim(),
          label: s.label.trim(),
          sort_order: i,
        }))

      const { error } = await saveStats(items)
      if (error) { addToast('Save failed: ' + error.message, 'error'); setSaving(false); return }
      addToast('Stats saved to database — homepage is live!', 'success')
      setSaving(false)
      load()
    } catch (e) {
      addToast('Save failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
      setSaving(false)
    }
  }

  return (
    <PageErrorBoundary name="Stats Editor">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Site Statistics</h2>
          <p className="mt-0.5 text-xs dark:text-zinc-600">Big number (value) + description (label) — shown on homepage &amp; footer</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50" onClick={handleSave} disabled={saving}>
            <SaveIcon size={13} /> {saving ? 'Saving...' : 'Save to DB'}
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
          <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">
            {stats.length} Row{stats.length !== 1 ? 's' : ''}
          </h3>
          <button className="flex items-center gap-1 rounded-lg bg-emerald-500 min-h-[44px] sm:min-h-0 px-3 py-2 sm:px-2.5 sm:py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-400" onClick={add}>
            <PlusIcon size={12} /> Add Stat
          </button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg dark:bg-zinc-800/50" />
              ))}
            </div>
          ) : stats.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <BarChartIcon size={24} className="dark:text-zinc-700" />
              <div className="text-sm font-medium text-zinc-500">No stats yet</div>
              <div className="text-xs dark:text-zinc-700">Click &ldquo;Add Stat&rdquo; to create the first row</div>
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
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${i === 0 ? 'cursor-not-allowed opacity-20' : ''}`}>
                      <MoveUpIcon size={10} />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === stats.length - 1}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${i === stats.length - 1 ? 'cursor-not-allowed opacity-20' : ''}`}>
                      <MoveDownIcon size={10} />
                    </button>
                  </div>

                  {/* Row number */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-400">{i + 1}</span>

                  {/* Value field — this is the BIG NUMBER displayed on site */}
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-medium text-zinc-500">Value *</label>
                    <input value={s.value} onChange={e => update(i, 'value', e.target.value)}
                      placeholder="Big number — e.g. 90kg+"
                      className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                  </div>

                  {/* Label field — this is the DESCRIPTION text */}
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-medium text-zinc-500">Label *</label>
                    <input value={s.label} onChange={e => update(i, 'label', e.target.value)}
                      placeholder="Description — e.g. Waste Collected"
                      className="w-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50" />
                  </div>

                  <button onClick={() => remove(i)}
                    className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 mt-5">
                    <XIcon size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
    </PageErrorBoundary>
  )
}
