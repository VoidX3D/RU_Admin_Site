import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { processFiles, renameImage } from '../utils/image'
import type { MissionEntry, StatRow, PendingImage, Draft } from '../types'
import { ArrowLeftIcon, PlusIcon, XIcon, ImageIcon, UploadIcon, TargetIcon, RefreshIcon, SaveIcon, TrashIcon, EditIcon, CheckIcon } from './Icons'
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

  async function loadMissions() {
    setLoading(true)
    try {
      const r = await fetch(getBase('src/mission/list.json'))
      const d = await r.json()
      setMissions(d.missions || [])
    } catch { setMissions([]) }
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
      <div className="form-page">
        <div className="form-page-header">
          <div>
            <div className="form-page-title">
              <button className="btn btn-secondary btn-icon" onClick={() => setMode('list')}><ArrowLeftIcon size={18} /></button>
              <h2>{fId ? 'Edit Mission' : 'Create Mission'}</h2>
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
            <TargetIcon size={16} style={{ color: 'var(--blue)' }} />
            <h3>Basic Information</h3>
          </div>
          <div className="form-card-body">
            <div className="field-group field-group-2">
              <Field label="Mission ID" value={fId} onChange={() => {}} readOnly error={errors.id} />
              <Field label="Tag / Badge" value={fTag} onChange={setFTag} placeholder="Mission #XX" hint="Appears as a badge on the card" />
              <div className="full">
                <Field label="Title *" value={fTitle} onChange={setFTitle} placeholder="Enter mission title"
                  error={errors.title} maxLength={100}
                  hint="A clear, descriptive title for your mission" />
              </div>
              <Field label="Date" value={fDate} onChange={setFDate} placeholder="May 2025" hint="Month and year" />
              <div className="full">
                <Field label="Short Description *" value={fDesc} onChange={setFDesc} placeholder="One sentence summary"
                  error={errors.description} maxLength={200} hint="Appears on the mission card" />
              </div>
              <div className="full">
                <Textarea label="Full Story" value={fDetail} onChange={setFDetail} placeholder="Write the complete mission story, details, impact, and outcomes..." rows={8} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <PlusIcon size={16} style={{ color: 'var(--accent)' }} />
            <h3>Statistics</h3>
          </div>
          <div className="form-card-body">
            <StatsEditor stats={fStats} onChange={setFStats} keyPlaceholder="Label (e.g. volunteers)" valuePlaceholder="Value (e.g. 25+)" />
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <PlusIcon size={16} style={{ color: 'var(--purple)' }} />
            <h3>Partners</h3>
          </div>
          <div className="form-card-body">
            <PartnersEditor partners={fPartners} onChange={setFPartners} />
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <span style={{ color: 'var(--text-tertiary)' }}>👁</span>
            <h3>Visibility</h3>
          </div>
          <div className="form-card-body">
            <Toggle label="Show on site" checked={fShow} onChange={setFShow}
              onLabel="Visible to visitors" offLabel="Hidden from visitors" />
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <ImageIcon size={16} style={{ color: 'var(--blue)' }} />
            <h3>Images ({fImages.length})</h3>
          </div>
          <div className="form-card-body">
            <ImageUpload images={fImages} onChange={setFImages} />
            <div className="form-row-hint">Drag to reorder. First image is used as the featured/cover image.</div>
          </div>
        </div>
      </div>
    )
  }

  const allDrafts = Storage.listDrafts().filter(d => d.type === 'mission')
  return (
    <div className="page-enter">
      <div className="form-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Missions</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Create and manage mission posts with unlimited images</p>
        </div>
        <div className="form-page-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadMissions}><RefreshIcon size={14} /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={startNew}><PlusIcon size={14} /> New Mission</button>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div>
            <div className="skeleton-table-row" style={{ background: 'var(--surface-hover)' }}>
              <div className="skeleton skeleton-text" style={{ width: '30%' }} />
              <div className="skeleton skeleton-text short" />
              <div className="skeleton skeleton-text short" />
              <div className="skeleton skeleton-text short" style={{ width: 50 }} />
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-button" style={{ marginLeft: 'auto' }} />
            </div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton-table-row">
                <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                <div className="skeleton skeleton-text short" />
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
              <tr>
                <th>Mission</th><th>Tag</th><th>Date</th><th>Images</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.length === 0 && allDrafts.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">
                  <div className="empty-state-icon">🎯</div>
                  <div className="empty-state-title">No missions yet</div>
                  <div className="empty-state-desc">Click "New Mission" to create one.</div>
                </div></td></tr>
              ) : (
                <>
                  {missions.map(m => (
                    <tr key={m.id}>
                      <td><div style={{ fontWeight: 600 }}>{m.title}</div></td>
                      <td><span className="badge badge-info">{m.tag || '—'}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.date || '—'}</td>
                      <td><ImageIcon size={14} style={{ color: 'var(--text-tertiary)', verticalAlign: 'middle' }} /> {m.imageCount || '?'}</td>
                      <td>
                        {m.show !== false ? (
                          <span className="badge badge-success"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-dark)', display: 'inline-block', marginRight: 4 }} />Active</span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-tertiary)' }}>Hidden</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(m.id)}><EditIcon size={13} /> Edit</button>
                      </td>
                    </tr>
                  ))}
                  {allDrafts.filter(d => !missions.find(m => (m.id || m.slug) === d.id)).map(d => (
                    <tr key={d.id} style={{ background: 'var(--amber-glow)' }}>
                      <td><div style={{ fontWeight: 600 }}>{d.title}</div><span style={{ fontSize: 11, color: 'var(--amber-dark)' }}>Draft</span></td>
                      <td>—</td><td style={{ color: 'var(--text-secondary)' }}>{d.date || '—'}</td>
                      <td>{String(d.imageCount || 0)}</td>
                      <td><span className="badge badge-warning">Draft</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setPendingDraftId(d.id); setView('draftDiff') }}>Open</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => { Storage.deleteDraft('mission', d.id); setDrafts(Storage.listDrafts().filter(dd => dd.type === 'mission')); addToast('Draft deleted', 'info') }}>
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
