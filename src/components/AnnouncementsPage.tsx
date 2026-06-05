import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { processFiles } from '../utils/image'
import type { AnnouncementEntry, PendingImage } from '../types'
import { ArrowLeftIcon, PlusIcon, XIcon, ImageIcon, UploadIcon, MegaphoneIcon, RefreshIcon, SaveIcon, TrashIcon, EditIcon, CheckIcon } from './Icons'
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

    try {
      const r = await fetch(getBase(`src/announcements/main/${a!.id}.json`))
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
      <div className="form-page">
        <div className="form-page-header">
          <div>
            <div className="form-page-title">
              <button className="btn btn-secondary btn-icon" onClick={() => setMode('list')}><ArrowLeftIcon size={18} /></button>
              <h2>{fId ? 'Edit Announcement' : 'Create Announcement'}</h2>
            </div>
            <div className="form-page-id">{fId}</div>
          </div>
          <div className="form-page-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {saveStatus === 'saving' && <>Saving...</>}
              {saveStatus === 'saved' && <><CheckIcon size={11} style={{ color: 'var(--accent-dark)' }} /> Saved</>}
            </span>
            <button className="btn btn-secondary" onClick={() => setMode('list')}>Cancel</button>
            <button className="btn" style={{ background: 'var(--amber)', color: '#fff' }} onClick={saveDraft}>
              <SaveIcon size={16} /> Save Draft
            </button>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <MegaphoneIcon size={16} style={{ color: 'var(--amber-dark)' }} />
            <h3>Basic Information</h3>
          </div>
          <div className="form-card-body">
            <div className="field-group field-group-2">
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
              <Field label="Deadline" value={fDeadline} onChange={setFDeadline} placeholder="e.g. June 15, 2026" hint="Display deadline date (shown when status is Deadline)" />
              <div className="full">
                <Field label="Title *" value={fTitle} onChange={setFTitle} placeholder="Announcement title" error={errors.title}
                  maxLength={120} hint="Keep it concise and descriptive" />
              </div>
              <div className="full">
                <Textarea label="Summary *" value={fSummary} onChange={setFSummary} placeholder="One-sentence summary for the card"
                  error={errors.summary} maxLength={300} rows={2} />
              </div>
              <div className="full">
                <Textarea label="Full Description" value={fDesc} onChange={setFDesc} placeholder="Full announcement details, context, and information..." rows={6} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <PlusIcon size={16} style={{ color: 'var(--blue)' }} />
            <h3>Event Details</h3>
          </div>
          <div className="form-card-body">
            <div className="field-group field-group-2">
              <Field label="Day" value={fDay} onChange={setFDay} placeholder="e.g. Monday" hint="Day of the week" />
              <Field label="Time" value={fTime} onChange={setFTime} placeholder="e.g. 9:00 AM" />
              <Field label="Location" value={fLoc} onChange={setFLoc} placeholder="e.g. School ground" />
              <Field label="Issued By" value={fIssued} onChange={setFIssued} placeholder="e.g. Club Coordinator" />
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <PlusIcon size={16} style={{ color: 'var(--purple)' }} />
            <h3>Additional Information</h3>
          </div>
          <div className="form-card-body">
            <div className="field-group field-group-2">
              <Textarea label="Why It Matters" value={fImport} onChange={setFImport} placeholder="Explain the importance of this announcement..." rows={4} />
              <Textarea label="Instructions" value={fInstr} onChange={setFInstr} placeholder="How to participate, what to prepare..." rows={4} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <span style={{ color: 'var(--text-tertiary)' }}>👁</span>
            <h3>Visibility</h3>
          </div>
          <div className="form-card-body">
            <Toggle label="Show on site" checked={fActive} onChange={setFActive}
              onLabel="Active on site" offLabel="Hidden from visitors" />
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <ImageIcon size={16} style={{ color: 'var(--blue)' }} />
            <h3>Image</h3>
          </div>
          <div className="form-card-body">
            <ImageUpload images={fImg ? [fImg] : []} onChange={imgs => setFImg(imgs[0] || null)} single maxCount={1} />
          </div>
        </div>
      </div>
    )
  }

  const allDrafts = Storage.listDrafts().filter(d => d.type === 'announcement')
  return (
    <div className="page-enter">
      <div className="form-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Announcements</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Create announcements with up to 1 image</p>
        </div>
        <div className="form-page-actions">
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshIcon size={14} /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={startNew}><PlusIcon size={14} /> New Announcement</button>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div>
            <div className="skeleton-table-row" style={{ background: 'var(--surface-hover)' }}>
              <div className="skeleton skeleton-text" style={{ width: '35%' }} />
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-text short" />
              <div className="skeleton skeleton-text short" style={{ width: 50 }} />
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-button" style={{ marginLeft: 'auto' }} />
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton-table-row">
                <div className="skeleton skeleton-text" style={{ width: '35%' }} />
                <div className="skeleton skeleton-badge" />
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text short" style={{ width: 50 }} />
                <div className="skeleton skeleton-badge" />
                <div className="skeleton skeleton-button" style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Tag</th><th>Date</th><th>Image</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {anns.length === 0 && allDrafts.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">
                  <div className="empty-state-icon">📢</div>
                  <div className="empty-state-title">No announcements yet</div>
                  <div className="empty-state-desc">Click "New Announcement" to create one.</div>
                </div></td></tr>
              ) : (
                <>
                  {(() => {
                    const draftMap = new Map(allDrafts.map(d => [d.id, d]))
                    const merged = anns.map(a => {
                      const draft = draftMap.get(a.id)
                      return { live: a, draft, hasDraft: !!draft }
                    })
                    const draftOnly = allDrafts.filter(d => !anns.find(a => a.id === d.id))
                    const rows: { id: string; title: string; tag: string; date: string; active: boolean; hasDraft: boolean; isDraftOnly: boolean; hasImage: boolean; deleteDraft?: () => void }[] = []
                    for (const m of merged) {
                      const d = m.draft
                      const title = (d?.title as string) || m.live.title
                      const tag = (d?.tag as string) || m.live.tag || 'Update'
                      const date = (d?.date as string) || m.live.date || '—'
                      const active = d ? d.active !== false : m.live.active !== false
                      const hasImage = !!(d?.image || m.live.image)
                      const liveTag = m.live.tag || 'Update'
                      const liveDate = m.live.date || '—'
                      const changed = d && (
                        title !== m.live.title ||
                        tag !== liveTag ||
                        date !== liveDate ||
                        active !== (m.live.active !== false) ||
                        hasImage !== !!m.live.image ||
                        (d.summary as string) !== (m.live.summary || '')
                      )
                      rows.push({
                        id: m.live.id, title, tag, date, active,
                        hasDraft: m.hasDraft && !!changed, isDraftOnly: false, hasImage,
                      })
                    }
                    for (const d of draftOnly) {
                      rows.push({
                        id: d.id, title: d.title as string, tag: '—', date: (d.date as string) || '—',
                        active: d.active !== false, hasDraft: true, isDraftOnly: true, hasImage: !!d.image,
                        deleteDraft: () => { Storage.deleteDraft('announcement', d.id); addToast('Draft deleted', 'info') },
                      })
                    }
                    return rows.map(r => (
                      <tr key={r.id} style={r.hasDraft ? { background: 'var(--amber-glow)' } : undefined}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.title}</div>
                          {r.hasDraft && <span style={{ fontSize: 11, color: 'var(--amber-dark)' }}>Draft</span>}
                        </td>
                        <td><span className="badge badge-info">{r.tag}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.date}</td>
                        <td>{r.hasImage ? <ImageIcon size={16} style={{ color: 'var(--amber)' }} /> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                        <td>{r.active ? <span className="badge badge-success">Active</span> : <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-tertiary)' }}>Hidden</span>}</td>
                        <td>
                          {r.isDraftOnly ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setPendingDraftId(r.id); setView('draftDiff') }}>Open</button>
                              <button className="btn btn-danger btn-sm btn-icon" onClick={r.deleteDraft}><TrashIcon size={13} /></button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => startEdit(r.id)}><EditIcon size={13} /> Edit</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  })()}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
