import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { prepareFileDiffs } from '../utils/diff'
import type { FileDiff } from '../utils/diff'
import { DiffView } from './DiffView'
import { ArrowLeftIcon, EditIcon, FileTextIcon } from './Icons'

function getBase(path = '') {
  const s = Storage.getSettings()
  return `https://raw.githubusercontent.com/${s.repoOwner}/${s.repoName}/${s.repoBranch}/${path}`
}

export function DraftDiffPage() {
  const setView = useStore(s => s.setView)
  const setPrOpen = useStore(s => s.setPrOpen)
  const setPendingDraftId = useStore(s => s.setPendingDraftId)
  const addToast = useStore(s => s.addToast)
  const pendingDraftId = useStore(s => s.pendingDraftId)

  const [diffs, setDiffs] = useState<FileDiff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftType, setDraftType] = useState('')
  const [draftId, setDraftId] = useState('')

  useEffect(() => {
    const id = pendingDraftId
    if (!id) { setView('dashboard'); return }
    setDraftId(id)

    async function load() {
      const drafts = Storage.listDrafts()
      const draft = drafts.find(d => d.id === id)
      if (!draft) {
        setError('Draft not found')
        setLoading(false)
        return
      }
      setDraftTitle(draft.title as string)
      setDraftType(draft.type as string)

      try {
        const fetchCurrent = async (path: string): Promise<string | null> => {
          try {
            const res = await fetch(getBase(path))
            return res.ok ? res.text() : null
          } catch { return null }
        }

        const fileDiffs = await prepareFileDiffs([draft as unknown as Record<string, unknown>], fetchCurrent)
        setDiffs(fileDiffs)
      } catch {
        setError('Could not load diff. Check your connection.')
      }
      setLoading(false)
    }
    load()
    setPendingDraftId(null)
  }, [pendingDraftId])

  function handleEdit() {
    setPendingDraftId(draftId)
    setView(draftType === 'mission' ? 'missions' : 'announcements')
  }

  function handlePublish() {
    setPrOpen(true)
  }

  return (
    <div className="page-enter" style={{ maxWidth: 800 }}>
      <div className="form-page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-secondary btn-icon" onClick={() => setView('dashboard')}>
            <ArrowLeftIcon size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {loading ? 'Loading...' : draftTitle || 'Draft Diff'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
              {loading ? 'Comparing with live site data' : `${diffs.length} file${diffs.length !== 1 ? 's' : ''} changed`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleEdit}>
            <EditIcon size={14} /> Edit Draft
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePublish}>
            <FileTextIcon size={14} /> Publish
          </button>
        </div>
      </div>

      {loading ? (
        <div>
          <div className="skeleton skeleton-card" style={{ height: 60, marginBottom: 12 }} />
          <div className="skeleton skeleton-card" style={{ height: 60, marginBottom: 12 }} />
          <div className="skeleton skeleton-card" style={{ height: 60, marginBottom: 12 }} />
        </div>
      ) : error ? (
        <div className="info-banner info-banner-error" style={{ marginBottom: 16 }}>
          <span>⚠</span> {error}
        </div>
      ) : diffs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No changes detected</div>
            <div className="empty-state-desc">This draft matches the live site data.</div>
          </div>
        </div>
      ) : (
        <div>
          <DiffView
            diffs={diffs}
            commitMessage=""
            onCommitMessageChange={() => {}}
            onPublish={handlePublish}
            publishing={false}
          />
        </div>
      )}
    </div>
  )
}
