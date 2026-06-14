import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchMembers, saveMembers, uploadBase64Image } from '../utils/supabase'
import { UsersIcon, PlusIcon, XIcon, RefreshIcon, ImageIcon, DownloadIcon } from './Icons'
import { PageErrorBoundary } from './PageErrorBoundary'

type Tab = 'teachers' | 'core' | 'general'

interface MemberFull {
  name: string
  class?: string
  role: string
  image?: string
  member_type?: string
}

export function MembersPage() {
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('core')
  const [teachers, setTeachers] = useState<MemberFull[]>([])
  const [core, setCore] = useState<MemberFull[]>([])
  const [general, setGeneral] = useState<MemberFull[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [refreshTrigger])

  async function load() {
    setLoading(true)
    try {
      const d = await fetchMembers()
      if (d) {
        setTeachers(d.teachers || [])
        setCore(d.core || [])
        setGeneral(d.general || [])
      }
    } catch (e) { console.error('[Members] Load failed:', e); addToast('Failed to load members', 'error') }
    setLoading(false)
  }

  function addMember() {
    setValidationErrors({})
    const base: MemberFull = { name: '', class: '', role: '', image: '', member_type: '' }
    if (tab === 'teachers') setTeachers(p => [...p, { ...base, role: 'Advisor', member_type: 'patron' }])
    else if (tab === 'core') setCore(p => [...p, { ...base, role: 'Coordinator', member_type: 'coord' }])
    else setGeneral(p => [...p, { ...base, role: 'General Member', member_type: 'member' }])
  }

  function upd(idx: number, field: keyof MemberFull, val: string) {
    setValidationErrors({})
    const fn = (arr: MemberFull[], set: (v: MemberFull[]) => void) => set(arr.map((m, i) => i === idx ? { ...m, [field]: val } : m))
    if (tab === 'teachers') fn(teachers, setTeachers)
    else if (tab === 'core') fn(core, setCore)
    else fn(general, setGeneral)
  }

  function remove(idx: number) {
    if (tab === 'teachers') setTeachers(p => p.filter((_, i) => i !== idx))
    else if (tab === 'core') setCore(p => p.filter((_, i) => i !== idx))
    else setGeneral(p => p.filter((_, i) => i !== idx))
  }

  async function handleImageUpload(idx: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      input.remove()
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase().slice(0, 20)
          const filename = `members/member_${Date.now()}_${cleanName}`
          const result = await uploadBase64Image('public', filename, dataUrl)
          if (result.url) {
            upd(idx, 'image', result.url)
            addToast('Image uploaded', 'success')
          } else {
            addToast('Upload failed', 'error')
          }
        } catch (e) {
          console.error('[Members] Image upload failed:', e)
          addToast('Upload failed: network error', 'error')
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function stripUrl(url: string): string {
    const clean = url.split('?')[0]
    if (clean.startsWith('http') && !clean.includes('supabase')) {
      return clean
    }
    if (clean.startsWith('http')) {
      const parts = clean.split('/')
      const bucketIdx = parts.findIndex(p => p === 'ruclub')
      if (bucketIdx !== -1) {
        const afterAssets = parts.slice(bucketIdx + 3).join('/')
        return afterAssets
      }
      const memberIdx = parts.findIndex(p => p.startsWith('members'))
      if (memberIdx !== -1) return parts.slice(memberIdx).join('/')
      return clean.split('/').pop() || clean
    }
    return clean
  }

  const [showExport, setShowExport] = useState(false)

  function exportCSV() {
    const headers = ['Name', 'Class', 'Role', 'Type', 'Group', 'Image']
    const rows: string[][] = []
    teachers.forEach(m => rows.push([m.name, m.class || '', m.role, m.member_type || '', 'Teachers', m.image || '']))
    core.forEach(m => rows.push([m.name, m.class || '', m.role, m.member_type || '', 'Core Team', m.image || '']))
    general.forEach(m => rows.push([m.name, m.class || '', m.role, m.member_type || '', 'General', m.image || '']))

    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `members_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    setShowExport(false)
    addToast('Members exported as CSV', 'success')
  }

  function exportJSON() {
    const data = { teachers, core, general, exported: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `members_${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
    setShowExport(false)
    addToast('Members exported as JSON', 'success')
  }

  function validateMembers(): boolean {
    const errs: Record<string, string> = {}
    const allMembers = [...teachers, ...core, ...general]
    allMembers.forEach((m, i) => {
      if (!m.name.trim()) errs[`name_${i}`] = 'Name is required'
      if (!m.role.trim()) errs[`role_${i}`] = 'Role is required'
    })
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validateMembers()) { addToast('Please fix member validation errors', 'error'); return }
    setSaving(true)
    try {
      const filtered = {
        teachers: teachers.filter(t => t.name.trim()).map(m => ({ ...m, image: m.image ? stripUrl(m.image) : '' })),
        core: core.filter(c => c.name.trim()).map(m => ({ ...m, image: m.image ? stripUrl(m.image) : '' })),
        general: general.filter(g => g.name.trim()).map(m => ({ ...m, image: m.image ? stripUrl(m.image) : '' })),
      }
      const { error } = await saveMembers(filtered as unknown as Record<string, unknown>)
      if (error) { addToast('Save failed: ' + error.message, 'error'); setSaving(false); return }
      addToast('Members saved to database!', 'success')
      setSaving(false)
      setValidationErrors({})
      load()
    } catch (e) {
      console.error('[Members] Save failed:', e)
      addToast('Save failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
      setSaving(false)
    }
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
    <PageErrorBoundary name="Members">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Members</h2>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">Full member management with images &mdash; changes are live</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200" onClick={load}>
              <RefreshIcon size={13} /> Refresh
            </button>
            <div className="relative">
              <button
                className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => setShowExport(!showExport)}
              >
                <DownloadIcon size={13} /> Export
              </button>
              {showExport && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-lg">
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={exportCSV}>
                      Export as CSV
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={exportJSON}>
                      Export as JSON
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save to Database'}
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
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] ${
                tab === t.key ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500'
              }`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <UsersIcon size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-white">
                {tab === 'core' ? 'Core Team' : tab === 'teachers' ? 'Teachers' : 'General Members'}
              </span>
              <span className="rounded-md bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">{current.length}</span>
            </div>
            <button className="flex items-center gap-1 rounded-lg bg-emerald-500 min-h-[44px] sm:min-h-0 px-3 py-2 sm:px-2.5 sm:py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-400" onClick={addMember}>
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
                  <motion.div
                    key={i}
                    className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-3"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                      {/* Avatar / Image */}
                      <div
                        className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border dark:border-zinc-800 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 self-center sm:self-auto"
                        onClick={() => handleImageUpload(i)}
                      >
                        {m.image ? (
                          <img src={m.image} alt="" width="56" height="56" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {m.name.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40">
                          <ImageIcon size={14} className="text-white opacity-0 transition-opacity hover:opacity-100" />
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Name</label>
                          <input value={m.name} onChange={e => upd(i, 'name', e.target.value)} placeholder="Full name"
                            className={`w-full rounded-lg border ${validationErrors[`name_${i}`] ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-white outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10`} />
                          {validationErrors[`name_${i}`] && <p className="mt-0.5 text-[9px] text-red-500">{validationErrors[`name_${i}`]}</p>}
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Role</label>
                          <input value={m.role} onChange={e => upd(i, 'role', e.target.value)} placeholder="Role"
                            className={`w-full rounded-lg border ${validationErrors[`role_${i}`] ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-white outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10`} />
                          {validationErrors[`role_${i}`] && <p className="mt-0.5 text-[9px] text-red-500">{validationErrors[`role_${i}`]}</p>}
                        </div>
                        {tab !== 'teachers' && (
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Class</label>
                            <input value={m.class || ''} onChange={e => upd(i, 'class', e.target.value)} placeholder="8A"
                              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-white outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10" />
                          </div>
                        )}
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-600">Type</label>
                          <select value={m.member_type || ''} onChange={e => upd(i, 'member_type', e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-white outline-none focus:border-emerald-500/30">
                            <option value="patron">Patron</option>
                            <option value="advisor">Advisor</option>
                            <option value="coord">Coordinator</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                      </div>

                      <button className="flex min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-600 hover:bg-red-100 dark:bg-red-500/10 hover:text-red-600 self-center sm:self-start sm:mt-5" onClick={() => remove(i)}>
                        <XIcon size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input value={m.image || ''} onChange={e => upd(i, 'image', e.target.value)} placeholder="Image URL (or click avatar to upload)"
                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[10px] text-zinc-500 dark:text-zinc-500 outline-none focus:border-emerald-500/30 font-mono" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </PageErrorBoundary>
  )
}
