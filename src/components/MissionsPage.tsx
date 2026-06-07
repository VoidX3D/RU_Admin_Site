import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import type { MissionEntry, StatRow, PendingImage, Draft } from '../types'
import {
  ArrowLeftIcon, PlusIcon, ImageIcon, TargetIcon, RefreshIcon, SaveIcon, TrashIcon, EditIcon, CheckIcon, SearchIcon,
} from './Icons'
import { Field, Textarea, Toggle, ImageUpload, StatsEditor, PartnersEditor } from './form'

type Mode = 'list' | 'form'

function getBase(path = '') {
  const s = Storage.getSettings()
  return `https://raw.githubusercontent.com/${s.repoOwner}/${s.repoName}/${s.repoBranch}/${path}`
}

async function fetchImg(url: string): Promise<PendingImage | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const blob = await r.blob()
    return new Promise(resolve => {
      const fr = new FileReader()
      fr.onloadend = () => resolve({ dataUrl: fr.result as string, name: url.split('/').pop() || 'image', remote: true })
      fr.onerror = () => resolve(null)
      fr.readAsDataURL(blob)
    })
  } catch { return null }
}

export function MissionsPage() {
  const setView = useStore(s => s.setView)
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [mode, setMode] = useState<Mode>('list')
  const [missions, setMissions] = useState<MissionEntry[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const [fId, setFId] = useState('')
  const [fTitle, setFTitle] = useState('')
  const [fTag, setFTag] = useState('')
  const [fDate, setFDate] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fDetail, setFDetail] = useState('')
  const [fShow, setFShow] = useState(true)
  const [fStats, setFStats] = useState<StatRow[]>([])
  const [fPartners, setFPartners] = useState<string[]>([])
  const [fImages, setFImages] = useState<PendingImage[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  function doSave() {
    Storage.saveDraft('mission', fId, {
      id: fId, title: fTitle, tag: fTag, date: fDate,
      description: fDesc, detail: fDetail,
      stats: fStats.filter(s => s.key || s.value),
      partners: fPartners.filter(p => p.trim()),
      show: fShow, images: fImages, imageCount: fImages.length,
    })
    setSaveStatus('saved')
  }

  useEffect(() => {
    if (mode !== 'form' || !fId) return
    setSaveStatus('saving')
    doSave()
  }, [fId, fTitle, fTag, fDate, fDesc, fDetail, fShow, fStats, fPartners, fImages, mode])

  const doSaveRef = useRef(doSave)
  doSaveRef.current = doSave
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        doSaveRef.current()
        addToast('Draft saved!', 'success')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { loadMissions(); setDrafts(Storage.listDrafts().filter(d => d.type === 'mission')) }, [refreshTrigger])

  const pendingDraftId = useStore(s => s.pendingDraftId)
  const setPendingDraftId = useStore(s => s.setPendingDraftId)
  useEffect(() => {
    if (mode === 'list' && !loading && pendingDraftId) {
      setPendingDraftId(null)
      startEdit(pendingDraftId)
    }
  }, [pendingDraftId, mode, loading])

  const pendingAction = useStore(s => s.pendingAction)
  const setPendingAction = useStore(s => s.setPendingAction)
  useEffect(() => {
    if (mode === 'list' && !loading && pendingAction === 'newMission') {
      setPendingAction(null)
      startNew()
    }
  }, [pendingAction, mode, loading])

  useEffect(() => {
    if (mode !== 'list') return
    const id = setInterval(() => loadMissions(), 30000)
    return () => clearInterval(id)
  }, [mode])

  function cleanupStaleDrafts(live: MissionEntry[]) {
    const ids = new Set(live.map(m => m.id))
    const stale = Storage.listDrafts().filter(d => d.type === 'mission' && ids.has(d.id))
    for (const d of stale) {
      const liveEntry = live.find(m => m.id === d.id)
      if (!liveEntry) continue
      const changed = (
        (d.title as string) !== liveEntry.title ||
        (d.tag !== undefined && d.tag !== liveEntry.tag) ||
        (d.date !== undefined && d.date !== liveEntry.date) ||
        (d.show !== undefined && d.show !== liveEntry.show) ||
        (d.description !== undefined && d.description !== (liveEntry.description || ''))
      )
      if (!changed) Storage.deleteDraft('mission', d.id)
    }
  }

  async function loadMissions() {
    setLoading(true)
    try {
      const r = await fetch(getBase('src/mission/list.json'))
      const d = await r.json()
      const live = d.missions || []
      setMissions(live)
      cleanupStaleDrafts(live)
    } catch {
      setMissions([])
      addToast('Failed to load missions', 'error')
    }
    setLoading(false)
  }

  function startNew() {
    const n = String(missions.length + 1).padStart(2, '0')
    setFId('mission-' + n); setFTitle(''); setFTag('Mission #' + n)
    setFDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }))
    setFDesc(''); setFDetail(''); setFShow(true)
    setFStats([]); setFPartners([]); setFImages([]); setErrors({})
    setMode('form')
  }

  async function startEdit(id: string) {
    const m = missions.find(x => x.id === id || x.slug === id)
    const draft = Storage.getDraft('mission', id)
    if (!m && !draft) return

    setFId(id)
    if (m) {
      setFTitle(m.title); setFTag(m.tag || '')
      setFDate(m.date || ''); setFDesc(m.description || '')
      setFShow(m.show !== false)
    } else {
      setFTitle(''); setFTag('')
      setFDate(''); setFDesc('')
      setFShow(true)
    }
    setFDetail(''); setFStats([]); setFPartners([]); setFImages([]); setErrors({})

    if (draft) {
      setFTitle((draft.title as string) || (m?.title || ''))
      setFTag((draft.tag as string) || (m?.tag || ''))
      setFDate((draft.date as string) || (m?.date || ''))
      setFDesc((draft.description as string) || (m?.description || ''))
      setFShow(draft.show !== false)
      setFDetail((draft.detail as string) || '')
      setFStats((draft.stats as StatRow[]) || [])
      setFPartners((draft.partners as string[]) || [])
      setFImages((draft.images as PendingImage[]) || [])
      setMode('form'); return
    }

    try {
      const r = await fetch(getBase(`src/mission/${m!.id}/info.json`))
      if (r.ok) {
        const info = await r.json()
        setFDetail(info.detail || '')
        setFStats(Object.entries(info.stats || {}).map(([k, v]) => ({ key: k, value: String(v) })))
        setFPartners(info.partners || [])
        const imgs: PendingImage[] = []
        for (const f of (info.images || [])) {
          const img = await fetchImg(getBase(`src/mission/${m!.id}/${f}`))
          if (img) imgs.push(img)
        }
        setFImages(imgs)
      }
    } catch { /* ignore */ }
    setMode('form')
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!fTitle.trim()) errs.title = 'Title is required'
    if (!fDesc.trim()) errs.description = 'Description is required'
    if (!fId.trim()) errs.id = 'ID is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function saveDraft() {
    if (!validate()) { addToast('Please fix form errors', 'error'); return }
    const localImgs = fImages.filter(i => !i.remote)
    Storage.saveDraft('mission', fId, {
      id: fId, title: fTitle, tag: fTag, date: fDate,
      description: fDesc, detail: fDetail,
      stats: fStats.filter(s => s.key || s.value),
      partners: fPartners.filter(p => p.trim()),
      show: fShow, images: localImgs, imageCount: fImages.length,
    })
    addToast('Mission draft saved!', 'success')
    setDrafts(Storage.listDrafts().filter(d => d.type === 'mission'))
  }

  if (mode === 'form') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => setMode('list')}>
              <ArrowLeftIcon size={16} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white">{fId ? 'Edit Mission' : 'Create Mission'}</h2>
              <div className="text-xs text-zinc-600">{fId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              {saveStatus === 'saving' && <>Saving...</>}
              {saveStatus === 'saved' && <><CheckIcon size={10} className="text-emerald-400" /> Saved</>}
            </span>
            <button className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => setMode('list')}>
              Cancel
            </button>
            <button className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400" onClick={saveDraft}>
              <SaveIcon size={13} /> Save Draft
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <TargetIcon size={14} className="text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Basic Information</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mission ID" value={fId} onChange={() => {}} readOnly error={errors.id} />
                <Field label="Tag / Badge" value={fTag} onChange={setFTag} placeholder="Mission #XX" hint="Appears as a badge on the card" />
                <div className="sm:col-span-2">
                  <Field label="Title *" value={fTitle} onChange={setFTitle} placeholder="Enter mission title"
                    error={errors.title} maxLength={100}
                    hint="A clear, descriptive title for your mission" />
                </div>
                <Field label="Date" value={fDate} onChange={setFDate} placeholder="May 2025" hint="Month and year" />
                <div className="sm:col-span-2">
                  <Field label="Short Description *" value={fDesc} onChange={setFDesc} placeholder="One sentence summary"
                    error={errors.description} maxLength={200} hint="Appears on the mission card" />
                </div>
                <div className="sm:col-span-2">
                  <Textarea label="Full Story" value={fDetail} onChange={setFDetail} placeholder="Write the complete mission story, details, impact, and outcomes..." rows={8} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <PlusIcon size={14} className="text-emerald-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Statistics</h3>
            </div>
            <div className="p-4">
              <StatsEditor stats={fStats} onChange={setFStats} keyPlaceholder="Label (e.g. volunteers)" valuePlaceholder="Value (e.g. 25+)" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <PlusIcon size={14} className="text-purple-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Partners</h3>
            </div>
            <div className="p-4">
              <PartnersEditor partners={fPartners} onChange={setFPartners} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M2 12L9 19L22 6"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Visibility</h3>
            </div>
            <div className="p-4">
              <Toggle label="Show on site" checked={fShow} onChange={setFShow}
                onLabel="Visible to visitors" offLabel="Hidden from visitors" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <ImageIcon size={14} className="text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Images ({fImages.length})</h3>
            </div>
            <div className="p-4">
              <ImageUpload images={fImages} onChange={setFImages} />
              <div className="mt-2 text-[10px] text-zinc-700">Drag to reorder. First image is used as the featured cover image.</div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const allDrafts = Storage.listDrafts().filter(d => d.type === 'mission')
  const filtered = missions.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Missions</h2>
          <p className="mt-0.5 text-xs text-zinc-600">Create and manage mission posts with unlimited images</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={loadMissions}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400" onClick={startNew}>
            <PlusIcon size={13} /> New Mission
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2">
        <SearchIcon size={14} className="text-zinc-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search missions..."
          className="flex-1 bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-700"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Mission</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tag</th>
                <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">Date</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-zinc-800/50" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 && allDrafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <TargetIcon size={24} className="mx-auto text-zinc-700" />
                    <div className="mt-2 text-sm font-medium text-zinc-500">No missions yet</div>
                    <div className="text-xs text-zinc-700">Click "New Mission" to create one</div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const draftMap = new Map(allDrafts.map(d => [d.id, d]))
                  const merged = filtered.map(m => {
                    const draft = draftMap.get(m.id) || draftMap.get(m.slug || '')
                    return { live: m, draft, hasDraft: !!draft }
                  })
                  const draftOnly = allDrafts.filter(d => !missions.find(m => (m.id || m.slug) === d.id))
                  const rows: { id: string; title: string; tag: string; date: string; imageCount: number; active: boolean; hasDraft: boolean; isDraftOnly: boolean; deleteDraft?: () => void }[] = []
                  for (const m of merged) {
                    const d = m.draft
                    const title = (d?.title as string) || m.live.title
                    const tag = (d?.tag as string) || m.live.tag || '—'
                    const date = (d?.date as string) || m.live.date || '—'
                    const active = d ? d.show !== false : m.live.show !== false
                    const liveTag = m.live.tag || '—'
                    const liveDate = m.live.date || '—'
                    const changed = d && (
                      title !== m.live.title || tag !== liveTag || date !== liveDate ||
                      active !== (m.live.show !== false) ||
                      (d.description as string) !== (m.live.description || '')
                    )
                    rows.push({ id: m.live.id, title, tag, date, imageCount: 0, active, hasDraft: m.hasDraft && !!changed, isDraftOnly: false })
                  }
                  for (const d of draftOnly) {
                    rows.push({
                      id: d.id, title: d.title as string, tag: '—', date: (d.date as string) || '—',
                      imageCount: 0, active: d.show !== false, hasDraft: true, isDraftOnly: true,
                      deleteDraft: () => { Storage.deleteDraft('mission', d.id); setDrafts(Storage.listDrafts().filter(dd => dd.type === 'mission')); addToast('Draft deleted', 'info') },
                    })
                  }
                  return rows.map(r => (
                    <tr key={r.id} className={`transition-colors hover:bg-zinc-800/20 ${r.hasDraft ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-300">{r.title}</div>
                        {r.hasDraft && <div className="text-[10px] text-amber-400">Draft</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{r.tag}</span>
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell">{r.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-600'
                        }`}>
                          {r.active && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                          {r.active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.isDraftOnly ? (
                          <div className="flex items-center gap-1">
                            <button className="rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300" onClick={() => { setPendingDraftId(r.id); setView('draftDiff') }}>Open</button>
                            <button className="rounded-lg p-1 text-zinc-700 hover:bg-red-500/10 hover:text-red-400" onClick={r.deleteDraft}><TrashIcon size={12} /></button>
                          </div>
                        ) : (
                          <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300" onClick={() => startEdit(r.id)}>
                            <EditIcon size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
