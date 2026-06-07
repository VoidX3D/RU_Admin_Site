import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getPublishHistory, clearPublishHistory } from '../utils/history'
import type { PublishRecord } from '../utils/history'
import { getEnvConfig } from '../utils/env'
import { useStore } from '../store'
import {
  GitPullRequestIcon, ExternalLinkIcon, TrashIcon,
  FileTextIcon, ImageIcon, ClockIcon
} from './Icons'

const STATE_META: Record<string, { label: string; color: string }> = {
  open:   { label: 'Open',   color: 'text-emerald-400' },
  merged: { label: 'Merged', color: 'text-purple-400' },
  closed: { label: 'Closed', color: 'text-red-400' },
  unknown: { label: 'Unknown', color: 'text-zinc-500' },
}

async function fetchPRState(token: string, owner: string, repo: string, prNumber: number): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' },
    })
    if (!res.ok) return 'unknown'
    const data = await res.json()
    if (data.merged) return 'merged'
    return data.state || 'unknown'
  } catch { return 'unknown' }
}

function FileList({ files }: { files: PublishRecord['files'] }) {
  const [open, setOpen] = useState(false)
  if (files.length === 0) return null
  return (
    <div>
      <button
        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
        onClick={() => setOpen(!open)}
      >
        {files.length} file{files.length !== 1 ? 's' : ''} {open ? '\u25B2' : '\u25BC'}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {files.map(f => (
            <div key={f.path} className="flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600">
              <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded text-[7px] font-bold ${
                f.status === 'added' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {f.status === 'added' ? 'A' : 'M'}
              </span>
              {f.path.endsWith('.jpg') || f.path.endsWith('.png')
                ? <ImageIcon size={9} className="text-zinc-700" />
                : <FileTextIcon size={9} className="text-zinc-700" />
              }
              {f.path}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HistoryPage() {
  const theme = useStore(s => s.theme)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const [records, setRecords] = useState<PublishRecord[]>(() => getPublishHistory())
  const [updating, setUpdating] = useState(false)
  const envToken = getEnvConfig().GITHUB_TOKEN

  useEffect(() => {
    const all = getPublishHistory()
    setRecords(all)
    if (!envToken || all.length === 0) return
    let cancelled = false
    ;(async () => {
      setUpdating(true)
      const updated = await Promise.all(all.map(async r => {
        if (!r.prNumber || !r.owner || !r.repo) return r
        const state = await fetchPRState(envToken, r.owner, r.repo, r.prNumber)
        if (cancelled) return r
        return { ...r, state: state as PublishRecord['state'] }
      }))
      if (!cancelled) {
        setRecords(updated)
        setUpdating(false)
      }
    })()
    return () => { cancelled = true }
  }, [envToken, refreshTrigger])

  function handleClear() {
    if (confirm('Clear all publish history?')) {
      clearPublishHistory()
      setRecords([])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Publish History</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            {records.length === 0
              ? 'No publications yet'
              : `${records.length} publication${records.length !== 1 ? 's' : ''} total`
            }
            {updating && <span className="ml-2 text-[10px] text-zinc-700">Updating...</span>}
          </p>
        </div>
        {records.length > 0 && (
          <button className="flex items-center gap-1 rounded-lg border border-red-800/30 px-2.5 py-1.5 text-[10px] font-medium text-red-400 hover:bg-red-500/10" onClick={handleClear}>
            <TrashIcon size={11} /> Clear All
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 py-12 text-center">
          <GitPullRequestIcon size={28} className="mx-auto text-zinc-700" />
          <div className="mt-3 text-sm font-medium text-zinc-500">No publish history</div>
          <div className="mt-1 text-xs text-zinc-700">Published pull requests will appear here with their current status</div>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r, i) => {
            const meta = STATE_META[r.state || 'unknown'] || STATE_META.unknown
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/50">
                    <GitPullRequestIcon size={16} className={meta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-zinc-300">
                        {r.commitMessage || 'Pull Request'}
                      </span>
                      {r.prNumber && (
                        <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">#{r.prNumber}</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${meta.color.replace('text-', 'bg-').replace('emerald', 'emerald-500/10').replace('purple', 'purple-500/10').replace('red', 'red-500/10').replace('zinc', 'zinc-800')} ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-zinc-700">
                        <ClockIcon size={10} />
                        {new Date(r.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-600">
                      <span>{r.draftCount} draft{r.draftCount !== 1 ? 's' : ''}</span>
                      <FileList files={r.files} />
                    </div>
                  </div>
                  <a href={r.prUrl} target="_blank" rel="noopener noreferrer"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
                    title="View on GitHub">
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
