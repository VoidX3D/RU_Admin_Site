import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchMissions, fetchMissionDetail, saveMission, deleteMission, uploadBase64Image } from '../utils/supabase'
import type { MissionEntry, PendingImage, MissionTimeline } from '../types'
import { Modal } from './Modal'
import { ConfirmModal } from './ConfirmModal'
import { ContextMenu } from './ContextMenu'
import type { ContextAction } from './ContextMenu'
import {
  ArrowLeftIcon, PlusIcon, ImageIcon, TargetIcon, RefreshIcon, TrashIcon, EditIcon, SearchIcon, EyeIcon, EyeOffIcon,
} from './Icons'
import { Field, Textarea, Toggle, ImageUpload, StatsEditor, PartnersEditor, GoalsEditor, TimelineEditor, ParticipantsEditor, BudgetEditor } from './form'

function formatText(text: string): string {
  return text.split(/\n\s*\n/).filter(Boolean).map(p => p.trim()).join('\n\n')
}

type Mode = 'list' | 'form'

export function MissionsPage() {
  const setView = useStore(s => s.setView)
  const addToast = useStore(s => s.addToast)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [mode, setMode] = useState<Mode>('list')
  const [missions, setMissions] = useState<MissionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<{ title: string; content: string } | null>(null)
  const [ctx, setCtx] = useState<{ open: boolean; x: number; y: number; mission: MissionEntry | null }>({ open: false, x: 0, y: 0, mission: null })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [fId, setFId] = useState('')
  const [fTitle, setFTitle] = useState('')
  const [fTag, setFTag] = useState('')
  const [fDate, setFDate] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fDetail, setFDetail] = useState('')
  const [fShow, setFShow] = useState(true)
  const [fStats, setFStats] = useState<{ label: string; value: string }[]>([])
  const [fPartners, setFPartners] = useState<string[]>([])
  const [fGoals, setFGoals] = useState<string[]>([])
  const [fTimeline, setFTimeline] = useState<MissionTimeline[]>([])
  const [fParticipants, setFParticipants] = useState<{ group_name: string; participant_count: string }[]>([])
  const [fBudget, setFBudget] = useState<{ item: string; amount: string }[]>([])
  const [fImages, setFImages] = useState<PendingImage[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadMissions() }, [refreshTrigger])

  useEffect(() => {
    if (mode !== 'list') return
    const id = setInterval(() => loadMissions(), 30000)
    return () => clearInterval(id)
  }, [mode])

  const pendingAction = useStore(s => s.pendingAction)
  const setPendingAction = useStore(s => s.setPendingAction)
  useEffect(() => {
    if (mode === 'list' && !loading && pendingAction === 'newMission') {
      setPendingAction(null)
      startNew()
    }
  }, [pendingAction, mode, loading])

  async function loadMissions() {
    setLoading(true)
    try {
      const live = await fetchMissions()
      setMissions(live || [])
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
    setFStats([]); setFPartners([]); setFGoals([])
    setFTimeline([]); setFParticipants([]); setFBudget([])
    setFImages([]); setErrors({})
    setMode('form')
  }

  async function startEdit(id: string) {
    const m = missions.find(x => x.id === id || x.slug === id)
    if (!m) return

    setFId(id); setFTitle(m.title); setFTag(m.tag || '')
    setFDate(m.date || ''); setFDesc(m.description || '')
    setFShow(m.show !== false)
    setErrors({})

    const missionId = m?.id
    if (!missionId) { setMode('form'); return }

    try {
      const info = await fetchMissionDetail(missionId)
      if (info) {
        setFDetail(info.detail || '')
        setFStats((info.stats || []).map((s: { label: string; value: string }) => ({ label: s.label, value: String(s.value) })))
        setFPartners(info.partners || [])
        setFGoals(info.goals || [])
        setFTimeline(info.timeline || [])
        setFParticipants(info.participants || [])
        setFBudget(info.budget || [])
        const imgs: PendingImage[] = (info.images || []).map((img: unknown) => {
          const url = typeof img === 'string' ? img : (img as { url: string; alt?: string }).url
          return { dataUrl: url, name: url.split('/').pop() || 'image', remote: true }
        })
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

  async function handleSave() {
    if (!validate()) { addToast('Please fix form errors', 'error'); return }
    setSaving(true)

    try {
      const imageUrls: string[] = []
      for (let i = 0; i < fImages.length; i++) {
        if (fImages[i].remote && fImages[i].dataUrl.startsWith('http')) {
          imageUrls.push(fImages[i].dataUrl)
        } else if (fImages[i].dataUrl.startsWith('data:')) {
          const filename = `mission/${fId}/img-${String(i + 1).padStart(2, '0')}.jpg`
          const result = await uploadBase64Image('public', filename, fImages[i].dataUrl)
          if (result.url) imageUrls.push(result.url)
        }
      }

      const statsArr = fStats.filter(s => s.label).map(s => ({ label: s.label, value: s.value }))
      const { error } = await saveMission(fId, {
        slug: fId, title: fTitle, tag: fTag, date: fDate,
        description: fDesc, detail: fDetail, show: fShow,
        image_count: fImages.length, featured: imageUrls[0] || null,
        images: imageUrls, stats: statsArr,
        partners: fPartners.filter(p => p.trim()),
        goals: fGoals.filter(g => g.trim()),
        timeline: fTimeline.filter(t => t.title.trim()),
        participants: fParticipants.filter(p => p.group_name.trim()),
        budget: fBudget.filter(b => b.item.trim()),
      })
      if (error) { addToast('Save failed: ' + error.message, 'error'); return }

      addToast('Mission saved to database!', 'success')
      setMode('list')
      loadMissions()
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
    const { error } = await deleteMission(id)
    if (error) { addToast('Delete failed: ' + error.message, 'error'); return }
    addToast('Mission deleted', 'success')
    loadMissions()
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
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{fId ? 'Edit Mission' : 'Create Mission'}</h2>
              <div className="text-xs dark:text-zinc-600">{fId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border dark:border-zinc-800 min-h-[44px] sm:min-h-0 px-4 py-2 sm:px-3 sm:py-1.5 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={() => setMode('list')}>
              Cancel
            </button>
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
          {/* Basic Information */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <TargetIcon size={14} className="dark:text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Basic Information</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mission ID" value={fId} onChange={() => {}} readOnly error={errors.id} />
                <Field label="Tag / Badge" value={fTag} onChange={setFTag} placeholder="Mission #XX" hint="Appears as a badge on the card" />
                <div className="sm:col-span-2">
                  <Field label="Title *" value={fTitle} onChange={setFTitle} placeholder="Enter mission title"
                    error={errors.title} maxLength={100} hint="A clear, descriptive title for your mission" />
                </div>
                <Field label="Date" value={fDate} onChange={setFDate} placeholder="May 2025" hint="Month and year" />
                <div className="sm:col-span-2">
                  <Field label="Short Description *" value={fDesc} onChange={setFDesc} placeholder="One sentence summary"
                    error={errors.description} maxLength={200} hint="Appears on the mission card" />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider dark:text-zinc-400">Full Story</label>
                    {fDetail && (
                      <button
                        className="flex items-center gap-1 rounded-lg border dark:border-zinc-800 px-2.5 py-1 text-[10px] font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() => setPreview({ title: fTitle || 'Mission Story', content: fDetail })}
                      >
                        <EyeIcon size={12} /> Preview
                      </button>
                    )}
                  </div>
                  <Textarea label="" value={fDetail} onChange={setFDetail} placeholder="Write the complete mission story, details, impact, and outcomes..." rows={8} />
                  <p className="mt-1.5 text-[10px] dark:text-zinc-700">Use blank lines between paragraphs. This text supports multi-paragraph formatting.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Statistics</h3>
            </div>
            <div className="p-4">
              <StatsEditor stats={fStats} onChange={setFStats} keyPlaceholder="Label (e.g. volunteers)" valuePlaceholder="Value (e.g. 25+)" />
            </div>
          </div>

          {/* Partners */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Partners</h3>
            </div>
            <div className="p-4">
              <PartnersEditor partners={fPartners} onChange={setFPartners} />
            </div>
          </div>

          {/* Goals */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Goals</h3>
            </div>
            <div className="p-4">
              <GoalsEditor goals={fGoals} onChange={setFGoals} />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Timeline</h3>
            </div>
            <div className="p-4">
              <TimelineEditor timeline={fTimeline} onChange={setFTimeline} />
            </div>
          </div>

          {/* Participants */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Participants</h3>
            </div>
            <div className="p-4">
              <ParticipantsEditor participants={fParticipants} onChange={setFParticipants} />
            </div>
          </div>

          {/* Budget */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Budget</h3>
            </div>
            <div className="p-4">
              <BudgetEditor budget={fBudget} onChange={setFBudget} />
            </div>
          </div>

          {/* Visibility */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Visibility</h3>
            </div>
            <div className="p-4">
              <Toggle label="Show on site" checked={fShow} onChange={setFShow}
                onLabel="Visible to visitors" offLabel="Hidden from visitors" />
            </div>
          </div>

          {/* Images */}
          <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <ImageIcon size={14} className="dark:text-blue-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-400">Images ({fImages.length})</h3>
            </div>
            <div className="p-4">
              <ImageUpload images={fImages} onChange={setFImages} />
              <div className="mt-2 text-[10px] dark:text-zinc-700">Drag to reorder. First image is used as the featured cover image.</div>
            </div>
          </div>
        </div>

        <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || 'Preview'} wide>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 text-sm leading-relaxed dark:text-zinc-300">
            {preview && formatText(preview.content).split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Modal>
      </motion.div>
    )
  }

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
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Missions</h2>
          <p className="mt-0.5 text-xs dark:text-zinc-600">Create and manage mission posts with all data</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={loadMissions}>
            <RefreshIcon size={13} /> Refresh
          </button>
          <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white dark:hover:bg-emerald-400" onClick={startNew}>
            <PlusIcon size={13} /> New Mission
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border dark:border-zinc-800/50 dark:bg-zinc-900/30 px-3 min-h-[44px] sm:min-h-0 sm:py-2">
        <SearchIcon size={14} className="dark:text-zinc-600 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search missions..."
          className="flex-1 bg-transparent text-sm dark:text-zinc-300 outline-none placeholder:text-zinc-400 py-2"
        />
      </div>

      <div className="overflow-hidden rounded-xl border dark:border-zinc-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-800/50 dark:bg-zinc-900/50">
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
                      <div className="h-4 w-full animate-pulse rounded dark:bg-zinc-800/50" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <TargetIcon size={24} className="mx-auto dark:text-zinc-700" />
                    <div className="mt-2 text-sm font-medium text-zinc-500">No missions yet</div>
                    <div className="text-xs dark:text-zinc-700">Click "New Mission" to create one</div>
                  </td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="transition-colors hover:bg-zinc-200 dark:bg-zinc-800/20"
                    onContextMenu={e => { e.preventDefault(); setCtx({ open: true, x: e.clientX, y: e.clientY, mission: m }) }}>
                    <td className="px-4 py-3">
                      <div className="font-medium dark:text-zinc-300">{m.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium dark:text-emerald-400">{m.tag || '—'}</span>
                    </td>
                    <td className="hidden px-4 py-3 dark:text-zinc-600 sm:table-cell">{m.date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ m.show !== false ? 'bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-600' }`}>
                        {m.show !== false && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                        {m.show !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium dark:text-zinc-300 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-700 min-h-[36px] sm:min-h-0" onClick={() => startEdit(m.id)}>
                          <EditIcon size={12} /> Edit
                        </button>
                        <button className="rounded-lg p-2 dark:text-zinc-700 hover:bg-red-100 dark:bg-red-500/10 hover:text-red-600 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 sm:p-1" onClick={() => handleDelete(m.id)}>
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
        actions={ctx.mission ? [
          { icon: <EditIcon size={12} />, label: 'Edit Mission', onClick: () => startEdit(ctx.mission!.id) },
          { icon: ctx.mission.show !== false ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />,
            label: ctx.mission.show !== false ? 'Hide from site' : 'Show on site',
            onClick: async () => {
              const { error } = await saveMission(ctx.mission!.id, { ...ctx.mission, show: ctx.mission!.show === false })
              if (!error) loadMissions()
            }
          },
          { icon: <TrashIcon size={12} />, label: 'Delete', onClick: () => handleDelete(ctx.mission!.id), dangerous: true },
        ] : []}
      />
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Mission"
        message="Are you sure you want to delete this mission? This action cannot be undone. All associated data including images, stats, goals, timeline entries, and participant records will be permanently removed."
        confirmLabel="Delete Permanently"
        onConfirm={() => confirmDelete && executeDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>
  )
}
