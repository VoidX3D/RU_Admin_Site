import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchAnnouncements, fetchAnnouncementDetail, saveAnnouncement, deleteAnnouncement, uploadBase64Image } from '../utils/supabase'
import type { AnnouncementEntry, PendingImage } from '../types'
import { ConfirmModal } from './ConfirmModal'
import { ContextMenu } from './ContextMenu'
import {
  ArrowLeftIcon, PlusIcon, ImageIcon, MegaphoneIcon, RefreshIcon, TrashIcon, EditIcon, SearchIcon, EyeIcon, EyeOffIcon,
} from './Icons'
import { Field, Textarea, Select, Toggle, ImageUpload, RichTextEditor } from './form'

type Mode = 'list' | 'form'

export function AnnouncementsPage() {
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [mode, setMode] = useState<Mode>('list')
  const [anns, setAnns] = useState<AnnouncementEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [ctx, setCtx] = useState<{ open: boolean; x: number; y: number; ann: AnnouncementEntry | null }>({ open: false, x: 0, y: 0, ann: null })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
  const [fTags, setFTags] = useState<string[]>([])
  const [fImg, setFImg] = useState<PendingImage | null>(null)
  const [fGallery, setFGallery] = useState<PendingImage[]>([])
  const [saving, setSaving] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [refreshTrigger])

  useEffect(() => {
    if (mode !== 'list') return
    const id = setInterval(() => load(), 30000)
    return () => clearInterval(id)
  }, [mode])

  const pendingAction = useStore(s => s.pendingAction)
  const setPendingAction = useStore(s => s.setPendingAction)
  useEffect(() => {
    if (mode === 'list' && !loading && pendingAction === 'newAnnouncement') {
      setPendingAction(null)
      startNew()
    }
  }, [pendingAction, mode, loading])

  async function load() {
    setLoading(true)
    try {
      const live = await fetchAnnouncements()
      setAnns(live || [])
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
    setFActive(true); setFDeadline(''); setFTags([]); setFImg(null); setFGallery([]); setErrors({}); setMode('form')
  }

  function addTag(tag: string) {
    if (tag.trim() && !fTags.includes(tag.trim())) setFTags([...fTags, tag.trim()])
  }

  function removeTag(i: number) {
    setFTags(fTags.filter((_, idx) => idx !== i))
  }

  async function startEdit(id: string) {
    const a = anns.find(x => x.id === id)
    if (!a) return

    setFId(id); setFTitle(a.title); setFTag(a.tag || 'Update')
    setFDate(a.date); setFDay(a.day || ''); setFSummary(a.summary)
    setFActive(a.active !== false)
    setErrors({})

    const annId = a?.id
    if (!annId) { setMode('form'); return }

    try {
      const info = await fetchAnnouncementDetail(annId)
      if (info) {
        setFStatus(info.status || ''); setFTime(info.time || '')
        setFLoc(info.location || ''); setFIssued(info.issued_by || '')
        setFDesc(info.description || ''); setFImport(info.importance || '')
        setFInstr(info.instructions || ''); setFDeadline(info.deadline || '')
        if (info.image) {
          setFImg({ dataUrl: info.image, name: info.image.split('/').pop() || 'image', remote: true })
        }
        if (info.tags && Array.isArray(info.tags)) {
          setFTags(info.tags)
        }
        if (info.gallery && Array.isArray(info.gallery)) {
          setFGallery(info.gallery.map((g: { url: string; alt?: string }) => {
            const url = typeof g === 'string' ? g : g.url
            return { dataUrl: url, name: url.split('/').pop() || 'gallery', remote: true }
          }))
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

  async function handleSave() {
    if (!validate()) { addToast('Please fix form errors', 'error'); return }
    setSaving(true)

    try {
      let imageUrl = fImg?.dataUrl || null
      if (imageUrl?.startsWith('data:')) {
        const filename = `announcements/${fId}.jpg`
        const result = await uploadBase64Image('public', filename, imageUrl)
        if (result.url) imageUrl = result.url
      }

      const galleryUrls: string[] = []
      for (let i = 0; i < fGallery.length; i++) {
        if (fGallery[i].remote && fGallery[i].dataUrl.startsWith('http')) {
          galleryUrls.push(fGallery[i].dataUrl)
        } else if (fGallery[i].dataUrl.startsWith('data:')) {
          const filename = `announcements/${fId}/gallery-${String(i + 1).padStart(2, '0')}.jpg`
          const result = await uploadBase64Image('public', filename, fGallery[i].dataUrl)
          if (result.url) galleryUrls.push(result.url)
        }
      }

      const { error } = await saveAnnouncement(fId, {
        title: fTitle, tag: fTag, status: fStatus, date: fDate,
        day: fDay, time: fTime, location: fLoc, issued_by: fIssued,
        summary: fSummary, description: fDesc, importance: fImport,
        instructions: fInstr, active: fActive, deadline: fDeadline, image: imageUrl,
        tags: fTags,
        gallery: galleryUrls,
      })
      if (error) { addToast(error.message, 'error'); return }

      addToast('Announcement saved!', 'success')
      setMode('list')
      load()
    } catch (e) {
      addToast('Save failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
    }
    setSaving(false)
  }

  function handleDelete(id: string) {
    setConfirmDelete(id)
  }

  async function executeDelete(id: string) {
    setConfirmDelete(null)
    const { error } = await deleteAnnouncement(id)
    if (error) { addToast('Delete failed: ' + error.message, 'error'); return }
    addToast('Announcement deleted', 'success')
    load()
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
            <button className="flex min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8 items-center justify-center rounded-lg border dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={() => setMode('list')}>
              <ArrowLeftIcon size={16} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{fId ? 'Edit Announcement' : 'Create Announcement'}</h2>
              <div className="text-xs dark:text-zinc-600">{fId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border dark:border-zinc-800 min-h-[44px] sm:min-h-0 px-4 py-2 sm:px-3 sm:py-1.5 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={() => setMode('list')}>Cancel</button>
            <button
              className="rounded-lg bg-emerald-500 min-h-[44px] sm:min-h-0 px-5 py-2 sm:px-4 sm:py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <MegaphoneIcon size={14} className="dark:text-amber-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Basic Information</h3>
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
                <Field label="Deadline" value={fDeadline} onChange={setFDeadline} placeholder="e.g. June 15, 2026" />
                <div className="sm:col-span-2">
                  <Field label="Title *" value={fTitle} onChange={setFTitle} placeholder="Announcement title" error={errors.title} maxLength={120} />
                </div>
                <div className="sm:col-span-2">
                  <Textarea label="Summary *" value={fSummary} onChange={setFSummary} placeholder="One-sentence summary for the card" error={errors.summary} maxLength={300} rows={2} />
                </div>
                <div className="sm:col-span-2">
                  <RichTextEditor label="Full Description" value={fDesc} onChange={setFDesc} placeholder="Full announcement details, context, and information..." />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Event Details</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Day" value={fDay} onChange={setFDay} placeholder="e.g. Monday" />
                <Field label="Time" value={fTime} onChange={setFTime} placeholder="e.g. 9:00 AM" />
                <Field label="Location" value={fLoc} onChange={setFLoc} placeholder="e.g. School ground" />
                <Field label="Issued By" value={fIssued} onChange={setFIssued} placeholder="e.g. Club Coordinator" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Additional Info</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <RichTextEditor label="Why It Matters" value={fImport} onChange={setFImport} placeholder="Explain the importance..." minHeight="120px" />
                </div>
                <div>
                  <RichTextEditor label="Instructions" value={fInstr} onChange={setFInstr} placeholder="How to participate, what to prepare..." minHeight="120px" />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Tags ({fTags.length})</h3>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {fTags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium dark:text-emerald-400">
                    {tag}
                    <button onClick={() => removeTag(i)} className="hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={tagInputRef}
                  placeholder="Add a tag..."
                  className="flex-1 rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-xs dark:text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addTag((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <button
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
                  onClick={() => {
                    const input = tagInputRef.current
                    if (input && input.value) { addTag(input.value); input.value = '' }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Visibility</h3>
            </div>
            <div className="p-4">
              <Toggle label="Show on site" checked={fActive} onChange={setFActive}
                onLabel="Active on site" offLabel="Hidden from visitors" />
            </div>
          </div>

          {/* Main Image */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <ImageIcon size={14} className="dark:text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Cover Image</h3>
            </div>
            <div className="p-4">
              <ImageUpload images={fImg ? [fImg] : []} onChange={imgs => setFImg(imgs[0] || null)} single maxCount={1} />
            </div>
          </div>

          {/* Gallery */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Gallery ({fGallery.length})</h3>
            </div>
            <div className="p-4">
              <ImageUpload images={fGallery} onChange={setFGallery} />
              <div className="mt-2 text-[10px] dark:text-zinc-700">Additional images for the announcement gallery.</div>
            </div>
          </div>
        </div>
    </motion.div>
  )
}

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
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Announcements</h2>
          <p className="mt-0.5 text-xs dark:text-zinc-600">Create and manage announcements with tags & gallery</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={load}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white dark:hover:bg-emerald-400" onClick={startNew}>
            <PlusIcon size={13} /> New Announcement
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border dark:border-zinc-800/50 dark:bg-zinc-900/30 px-3 min-h-[44px] sm:min-h-0 sm:py-2">
        <SearchIcon size={14} className="dark:text-zinc-600 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search announcements..."
          className="flex-1 bg-transparent text-sm dark:text-white outline-none placeholder:text-zinc-400 py-2"
        />
      </div>

      <div className="overflow-hidden rounded-xl border dark:border-zinc-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-800/50 dark:bg-zinc-900/50">
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
                      <div className="h-4 w-full animate-pulse rounded dark:bg-zinc-800/50" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <MegaphoneIcon size={24} className="mx-auto dark:text-zinc-700" />
                    <div className="mt-2 text-sm font-medium text-zinc-500">No announcements yet</div>
                    <div className="text-xs dark:text-zinc-700">Click "New Announcement" to create one</div>
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} className="transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/20"
                    onContextMenu={e => { e.preventDefault(); setCtx({ open: true, x: e.clientX, y: e.clientY, ann: a }) }}>
                    <td className="px-4 py-3">
                      <div className="font-medium dark:text-white">{a.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium dark:text-amber-400">{a.tag || 'Update'}</span>
                    </td>
                    <td className="hidden px-4 py-3 dark:text-zinc-600 sm:table-cell">{a.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ a.active !== false ? 'bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-600' }`}>
                        {a.active !== false && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                        {a.active !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium dark:text-white hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-700 min-h-[36px] sm:min-h-0" onClick={() => startEdit(a.id)}>
                          <EditIcon size={12} /> Edit
                        </button>
                        <button className="rounded-lg p-2 dark:text-zinc-700 hover:bg-red-100 dark:bg-red-500/10 hover:text-red-600 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 sm:p-1" onClick={() => handleDelete(a.id)}>
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContextMenu
        open={ctx.open}
        x={ctx.x} y={ctx.y}
        onClose={() => setCtx(o => ({ ...o, open: false }))}
        actions={ctx.ann ? [
          { icon: <EditIcon size={12} />, label: 'Edit Announcement', onClick: () => startEdit(ctx.ann!.id) },
          { icon: ctx.ann.active !== false ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />,
            label: ctx.ann.active !== false ? 'Hide from site' : 'Show on site',
            onClick: async () => {
              const { error } = await saveAnnouncement(ctx.ann!.id, { ...ctx.ann, active: ctx.ann!.active === false })
              if (!error) load()
            }
          },
          { icon: <TrashIcon size={12} />, label: 'Delete', onClick: () => handleDelete(ctx.ann!.id), dangerous: true },
        ] : []}
      />
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone. All associated data including images, tags, and gallery will be permanently removed."
        confirmLabel="Delete Permanently"
        onConfirm={() => confirmDelete && executeDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>
  )
}
