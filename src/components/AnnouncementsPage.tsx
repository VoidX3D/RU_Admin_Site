import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import type { AnnouncementEntry, PendingImage } from '../types'
import {
  ArrowLeftIcon, PlusIcon, ImageIcon, MegaphoneIcon, RefreshIcon, SaveIcon, TrashIcon, EditIcon, CheckIcon, SearchIcon,
} from './Icons'
import { Field, Textarea, Select, Toggle, ImageUpload } from './form'

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

export function AnnouncementsPage() {
  const setView = useStore(s => s.setView)
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [mode, setMode] = useState<Mode>('list')
  const [anns, setAnns] = useState<AnnouncementEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const [fId, setFId] = useState('')
  const [fTitle, setFTitle] = useState('')
  const [fTag, setFTag] = useState('Update')
  const [fStatus, setFStatus] = useState('')
  const [fDate, setFDate] = useState('')
  const [fDay, setFDay] = useState('')
  const [fTime, setFTime] = useState('')
  const [fLoc, setFLoc] = useState('')
  const [fIssued, setFIssued] = useState('')
  const [fSummary, setFSummary] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fImport, setFImport] = useState('')
  const [fInstr, setFInstr] = useState('')
  const [fActive, setFActive] = useState(true)
  const [fDeadline, setFDeadline] = useState('')
  const [fImg, setFImg] = useState<PendingImage | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  function doSave() {
    Storage.saveDraft('announcement', fId, {
      id: fId, title: fTitle, tag: fTag, status: fStatus, date: fDate,
      day: fDay, time: fTime, location: fLoc, issuedBy: fIssued,
      summary: fSummary, description: fDesc, importance: fImport,
      instructions: fInstr, active: fActive, deadline: fDeadline, image: fImg,
    })
    setSaveStatus('saved')
  }

  useEffect(() => {
    if (mode !== 'form' || !fId) return
    setSaveStatus('saving')
    doSave()
  }, [fId, fTitle, fTag, fStatus, fDate, fDay, fTime, fLoc, fIssued, fSummary, fDesc, fImport, fInstr, fActive, fDeadline, fImg, mode])

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

  useEffect(() => { load() }, [refreshTrigger])

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
    if (mode === 'list' && !loading && pendingAction === 'newAnnouncement') {
      setPendingAction(null)
      startNew()
    }
  }, [pendingAction, mode, loading])

  useEffect(() => {
    if (mode !== 'list') return
    const id = setInterval(() => load(), 30000)
    return () => clearInterval(id)
  }, [mode])

  function cleanupStaleDrafts(live: AnnouncementEntry[]) {
    const ids = new Set(live.map(a => a.id))
    const stale = Storage.listDrafts().filter(d => d.type === 'announcement' && ids.has(d.id))
    for (const d of stale) {
      const liveEntry = live.find(a => a.id === d.id)
      if (!liveEntry) continue
      const changed = (
        (d.title as string) !== liveEntry.title ||
        (d.tag !== undefined && d.tag !== liveEntry.tag) ||
        (d.date !== undefined && d.date !== liveEntry.date) ||
        (d.active !== undefined && d.active !== liveEntry.active) ||
        (d.image !== undefined && !!d.image !== !!liveEntry.image) ||
        (d.summary !== undefined && d.summary !== (liveEntry.summary || ''))
      )
      if (!changed) Storage.deleteDraft('announcement', d.id)
    }
  }

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(getBase('src/announcements/list.json'))
      const d = await r.json()
      const live = Array.isArray(d) ? d : []
      setAnns(live)
      cleanupStaleDrafts(live)
    } catch {
      setAnns([])
      addToast('Failed to load announcements', 'error')
    }
    setLoading(false)
  }

  function startNew() {
    const n = String(anns.length + 1).padStart(2, '0')
    setFId('announcement-' + n); setFTitle(''); setFTag('Update'); setFStatus('')
    setFDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
    setFDay(''); setFTime(''); setFLoc(''); setFIssued('')
    setFSummary(''); setFDesc(''); setFImport(''); setFInstr('')
    setFActive(true); setFDeadline(''); setFImg(null); setErrors({}); setMode('form')
  }

  async function startEdit(id: string) {
    const a = anns.find(x => x.id === id)
    const draft = Storage.getDraft('announcement', id)
    if (!a && !draft) return

    setFId(id)
    if (a) {
      setFTitle(a.title); setFTag(a.tag || 'Update')
      setFDate(a.date); setFDay(a.day || '')
      setFSummary(a.summary)
      setFActive(a.active !== false)
    } else {
      setFTitle(''); setFTag('Update')
      setFDate(''); setFDay(''); setFSummary('')
      setFActive(true)
    }
    setFStatus(''); setFTime(''); setFLoc(''); setFIssued('')
    setFDesc(''); setFImport(''); setFInstr(''); setFDeadline('')
    setFImg(null); setErrors({})

    if (draft) {
      setFTitle((draft.title as string) || (a?.title || ''))
      setFTag((draft.tag as string) || (a?.tag || 'Update'))
      setFDate((draft.date as string) || (a?.date || ''))
      setFSummary((draft.summary as string) || (a?.summary || ''))
      setFActive(draft.active !== false)
      setFStatus((draft.status as string) || '')
      setFDay((draft.day as string) || (a?.day || ''))
      setFTime((draft.time as string) || '')
      setFLoc((draft.location as string) || '')
      setFIssued((draft.issuedBy as string) || '')
      setFDesc((draft.description as string) || '')
      setFImport((draft.importance as string) || '')
      setFInstr((draft.instructions as string) || '')
      setFDeadline((draft.deadline as string) || '')
      if (draft.image) setFImg(draft.image as PendingImage)
      setMode('form'); return
    }

    const annId = a?.id
    if (!annId) return
    try {
      const r = await fetch(getBase(`src/announcements/main/${annId}.json`))
      if (r.ok) {
        const info = await r.json()
        setFDesc(info.description || ''); setFStatus(info.status || '')
        setFDay(info.day || ''); setFTime(info.time || ''); setFLoc(info.location || '')
        setFIssued(info.issuedBy || ''); setFImport(info.importance || ''); setFInstr(info.instructions || '')
        setFDeadline(info.deadline || '')
        if (info.image) {
          const fn = info.image.split('/').pop() || ''
          const img = await fetchImg(getBase(`src/announcements/assets/${fn}`))
          if (img) setFImg(img)
        }
      }
    } catch { /* ignore */ }
    setMode('form')
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!fTitle.trim()) errs.title = 'Title is required'
    if (!fSummary.trim()) errs.summary = 'Summary is required'
    if (!fDate.trim()) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function saveDraft() {
    if (!validate()) { addToast('Please fix form errors', 'error'); return }
    Storage.saveDraft('announcement', fId, {
      id: fId, title: fTitle, tag: fTag, status: fStatus, date: fDate,
      day: fDay, time: fTime, location: fLoc, issuedBy: fIssued,
      summary: fSummary, description: fDesc, importance: fImport,
      instructions: fInstr, active: fActive, deadline: fDeadline, image: fImg,
    })
    addToast('Announcement draft saved!', 'success')
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
              <h2 className="text-sm font-semibold text-white">{fId ? 'Edit Announcement' : 'Create Announcement'}</h2>
              <div className="text-xs text-zinc-600">{fId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              {saveStatus === 'saving' && <>Saving...</>}
              {saveStatus === 'saved' && <><CheckIcon size={10} className="text-emerald-400" /> Saved</>}
            </span>
            <button className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => setMode('list')}>Cancel</button>
            <button className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400" onClick={saveDraft}>
              <SaveIcon size={13} /> Save Draft
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <MegaphoneIcon size={14} className="text-amber-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Basic Information</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ID" value={fId} onChange={() => {}} readOnly />
                <Select label="Tag" value={fTag} onChange={setFTag}
                  options={[
                    { value: 'Update', label: 'Update' },
                    { value: 'Event', label: 'Event' },
                    { value: 'Notice', label: 'Notice' },
                    { value: 'Opportunity', label: 'Opportunity' },
                  ]} />
                <Field label="Date" value={fDate} onChange={setFDate} error={errors.date} />
                <Select label="Status" value={fStatus} onChange={setFStatus} placeholder="None"
                  options={[
                    { value: 'ongoing', label: 'Ongoing' },
                    { value: 'deadline', label: 'Deadline' },
                    { value: 'ended', label: 'Ended' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'upcoming', label: 'Upcoming' },
                  ]} />
                <Field label="Deadline" value={fDeadline} onChange={setFDeadline} placeholder="e.g. June 15, 2026" hint="Display deadline date" />
                <div className="sm:col-span-2">
                  <Field label="Title *" value={fTitle} onChange={setFTitle} placeholder="Announcement title" error={errors.title} maxLength={120} hint="Keep it concise and descriptive" />
                </div>
                <div className="sm:col-span-2">
                  <Textarea label="Summary *" value={fSummary} onChange={setFSummary} placeholder="One-sentence summary for the card" error={errors.summary} maxLength={300} rows={2} />
                </div>
                <div className="sm:col-span-2">
                  <Textarea label="Full Description" value={fDesc} onChange={setFDesc} placeholder="Full announcement details, context, and information..." rows={6} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <PlusIcon size={14} className="text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Event Details</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Day" value={fDay} onChange={setFDay} placeholder="e.g. Monday" hint="Day of the week" />
                <Field label="Time" value={fTime} onChange={setFTime} placeholder="e.g. 9:00 AM" />
                <Field label="Location" value={fLoc} onChange={setFLoc} placeholder="e.g. School ground" />
                <Field label="Issued By" value={fIssued} onChange={setFIssued} placeholder="e.g. Club Coordinator" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <PlusIcon size={14} className="text-purple-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Additional Information</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Textarea label="Why It Matters" value={fImport} onChange={setFImport} placeholder="Explain the importance of this announcement..." rows={4} />
                <Textarea label="Instructions" value={fInstr} onChange={setFInstr} placeholder="How to participate, what to prepare..." rows={4} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Visibility</h3>
            </div>
            <div className="p-4">
              <Toggle label="Show on site" checked={fActive} onChange={setFActive}
                onLabel="Active on site" offLabel="Hidden from visitors" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <ImageIcon size={14} className="text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Image</h3>
            </div>
            <div className="p-4">
              <ImageUpload images={fImg ? [fImg] : []} onChange={imgs => setFImg(imgs[0] || null)} single maxCount={1} />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const allDrafts = Storage.listDrafts().filter(d => d.type === 'announcement')
  const filtered = anns.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Announcements</h2>
          <p className="mt-0.5 text-xs text-zinc-600">Create announcements with up to 1 image</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400" onClick={startNew}>
            <PlusIcon size={13} /> New Announcement
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2">
        <SearchIcon size={14} className="text-zinc-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search announcements..."
          className="flex-1 bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-700"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Title</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tag</th>
                <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">Date</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-zinc-800/50" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 && allDrafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <MegaphoneIcon size={24} className="mx-auto text-zinc-700" />
                    <div className="mt-2 text-sm font-medium text-zinc-500">No announcements yet</div>
                    <div className="text-xs text-zinc-700">Click "New Announcement" to create one</div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const draftMap = new Map(allDrafts.map(d => [d.id, d]))
                  const merged = filtered.map(a => {
                    const draft = draftMap.get(a.id)
                    return { live: a, draft, hasDraft: !!draft }
                  })
                  const draftOnly = allDrafts.filter(d => !anns.find(a => a.id === d.id))
                  const rows: { id: string; title: string; tag: string; date: string; active: boolean; hasDraft: boolean; isDraftOnly: boolean; deleteDraft?: () => void }[] = []
                  for (const m of merged) {
                    const d = m.draft
                    const title = (d?.title as string) || m.live.title
                    const tag = (d?.tag as string) || m.live.tag || 'Update'
                    const date = (d?.date as string) || m.live.date || '—'
                    const active = d ? d.active !== false : m.live.active !== false
                    const liveTag = m.live.tag || 'Update'
                    const liveDate = m.live.date || '—'
                    const changed = d && (
                      title !== m.live.title || tag !== liveTag || date !== liveDate ||
                      active !== (m.live.active !== false) ||
                      (d.summary as string) !== (m.live.summary || '')
                    )
                    rows.push({ id: m.live.id, title, tag, date, active, hasDraft: m.hasDraft && !!changed, isDraftOnly: false })
                  }
                  for (const d of draftOnly) {
                    rows.push({
                      id: d.id, title: d.title as string, tag: '—', date: (d.date as string) || '—',
                      active: d.active !== false, hasDraft: true, isDraftOnly: true,
                      deleteDraft: () => { Storage.deleteDraft('announcement', d.id); addToast('Draft deleted', 'info') },
                    })
                  }
                  return rows.map(r => (
                    <tr key={r.id} className={`transition-colors hover:bg-zinc-800/20 ${r.hasDraft ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-300">{r.title}</div>
                        {r.hasDraft && <div className="text-[10px] text-amber-400">Draft</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">{r.tag}</span>
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
