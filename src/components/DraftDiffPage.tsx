import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => setView('dashboard')}>
            <ArrowLeftIcon size={16} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {loading ? 'Loading...' : draftTitle || 'Draft Diff'}
            </h2>
            <p className="text-xs text-zinc-600">
              {loading ? 'Comparing with live site data' : `${diffs.length} file${diffs.length !== 1 ? 's' : ''} changed`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={handleEdit}>
            <EditIcon size={13} /> Edit Draft
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400" onClick={handlePublish}>
            <FileTextIcon size={13} /> Publish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-800/30 bg-red-500/5 p-4 text-xs text-red-400">
          <span className="font-medium">Error:</span> {error}
        </div>
      ) : diffs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 py-12 text-center">
          <FileTextIcon size={28} className="mx-auto text-zinc-700" />
          <div className="mt-3 text-sm font-medium text-zinc-500">No changes detected</div>
          <div className="mt-1 text-xs text-zinc-700">This draft matches the live site data</div>
        </div>
      ) : (
        <DiffView
          diffs={diffs}
          commitMessage=""
          onCommitMessageChange={() => {}}
          onPublish={handlePublish}
          publishing={false}
        />
      )}
    </motion.div>
  )
}
