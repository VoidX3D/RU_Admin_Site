import { useState, useEffect } from 'react'
import { getPublishHistory, clearPublishHistory } from '../utils/history'
import type { PublishRecord } from '../utils/history'
import { getEnvConfig } from '../utils/env'
import { useStore } from '../store'
import {
  GitPullRequestIcon, ExternalLinkIcon, TrashIcon,
  FileTextIcon, ImageIcon, ClockIcon
} from './Icons'

const STATE_META: Record<string, { label: string; bg: string; color: string }> = {
  open:   { label: 'Open',    bg: 'rgba(34,197,94,0.12)', color: 'var(--accent-dark)' },
  merged: { label: 'Merged',  bg: 'rgba(168,85,247,0.12)', color: '#9333ea' },
  closed: { label: 'Closed',  bg: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  unknown: { label: 'Unknown', bg: 'rgba(139,148,158,0.12)', color: 'var(--text-tertiary)' },
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
  } catch {
    return 'unknown'
  }
}

function FileList({ files }: { files: PublishRecord['files'] }) {
  const [open, setOpen] = useState(false)
  if (files.length === 0) return null
  return (
    <div>
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize: 11, padding: '2px 8px' }}
        onClick={() => setOpen(!open)}
      >
        {files.length} file{files.length !== 1 ? 's' : ''} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{ marginTop: 6 }}>
          {files.map(f => (
            <div key={f.path} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '3px 8px', fontSize: 11, fontFamily: 'monospace',
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 3,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700,
                background: f.status === 'added' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: f.status === 'added' ? 'var(--accent-dark)' : 'var(--amber)',
              }}>
                {f.status === 'added' ? 'A' : 'M'}
              </span>
              {f.path.endsWith('.jpg') || f.path.endsWith('.png')
                ? <ImageIcon size={11} style={{ color: 'var(--text-tertiary)' }} />
                : <FileTextIcon size={11} style={{ color: 'var(--text-tertiary)' }} />
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
    <div className="page-enter" style={{ maxWidth: 720 }}>
      <div className="form-page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Publish History</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {records.length === 0
                ? 'No publications yet'
                : `${records.length} publication${records.length !== 1 ? 's' : ''} total`
              }
              {updating && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>Updating...</span>}
            </p>
          </div>
          {records.length > 0 && (
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={handleClear}>
              <TrashIcon size={13} /> Clear All
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ fontSize: 40 }}>📦</div>
            <div className="empty-state-title">No publish history</div>
            <div className="empty-state-desc">Published pull requests will appear here with their current status.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {records.map((r, i) => {
            const meta = STATE_META[r.state || 'unknown'] || STATE_META.unknown
            return (
              <div key={r.id} className="card" style={{
                padding: 0, overflow: 'hidden',
                animation: i < 3 ? `slideUp 0.2s ease ${i * 0.04}s both` : undefined,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '16px 20px',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: meta.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <GitPullRequestIcon size={17} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {r.commitMessage || 'Pull Request'}
                      </span>
                      {r.prNumber && (
                        <span className="badge badge-info" style={{ fontSize: 10 }}>#{r.prNumber}</span>
                      )}
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 8px', borderRadius: 10,
                        fontSize: 10, fontWeight: 600,
                        background: meta.bg, color: meta.color,
                        border: '1px solid ' + meta.color + '30',
                      }}>
                        {meta.label}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        <ClockIcon size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {new Date(r.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>{r.draftCount} draft{r.draftCount !== 1 ? 's' : ''}</span>
                      <FileList files={r.files} />
                    </div>
                  </div>
                  <a href={r.prUrl} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm btn-icon" style={{ flexShrink: 0 }}
                    title="View on GitHub">
                    <ExternalLinkIcon size={15} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
