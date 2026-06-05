import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { Storage } from '../utils/storage'
import { getEnvConfig, isProductionEnv, hasEnvAuth } from '../utils/env'
import { exportBackup, importBackup } from '../utils/backup'
import { listAdminBranches, analyzeBranches, deleteBranch, cleanupStaleBranches } from '../utils/github'
import type { BranchStatus } from '../utils/github'
import type { Settings } from '../types'
import {
  DownloadIcon, UploadIcon, RefreshIcon, AlertTriangleIcon, CheckCircleIcon,
  SaveIcon, LockIcon, FolderIcon, BranchIcon,
  EyeIcon, EyeOffIcon, GitPullRequestIcon, TrashIcon, PlusIcon,
  UserIcon, XIcon,
} from './Icons'

export function SettingsPage() {
  const addToast = useStore(s => s.addToast)
  const settings = Storage.getSettings()
  const [repoOwner, setRepoOwner] = useState(settings.repoOwner)
  const [repoName, setRepoName] = useState(settings.repoName)
  const [repoBranch, setRepoBranch] = useState(settings.repoBranch)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const env = getEnvConfig()
  const production = env.PRODUCTION_MODE
  const envAuth = hasEnvAuth()

  function save() {
    Storage.saveSettings({ ...settings, repoOwner, repoName, repoBranch })
    addToast(production ? 'Locked in production mode' : 'Repository settings saved', production ? 'warning' : 'success')
    if (!production) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  function handleExport() {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ru-admin-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Backup exported!', 'success')
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importBackup(reader.result as string)
      if (result.ok) {
        addToast(result.message, 'success')
        const s = Storage.getSettings()
        setRepoOwner(s.repoOwner)
        setRepoName(s.repoName)
        setRepoBranch(s.repoBranch)
      } else {
        addToast(result.message, 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="page-enter page-container">
      <div className="form-page-header">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Configuration, credentials, and data management</p>
        </div>
      </div>

      {production && (
        <div className="info-banner info-banner-warning" style={{ marginBottom: 20 }}>
          <LockIcon size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Production Mode Active</strong> — All settings locked and read from environment variables.
            Edit your <code>.env</code> file to change configuration.
          </div>
        </div>
      )}

      <div className="form-card">
        <div className="form-card-header">
          <UserIcon size={15} />
          <h3>Login Credentials</h3>
        </div>
        <div className="form-card-body">
          <div className="field-group field-group-2">
            <div>
              <label className="label">Username</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={settings.username} className="input" readOnly
                  style={{ cursor: 'default', opacity: 0.7 }} />
                <span className="badge badge-info" style={{ flexShrink: 0, fontSize: 10 }}>
                  <LockIcon size={10} /> from .env
                </span>
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="password" value={settings.password.replace(/./g, '•')} className="input" readOnly
                  style={{ cursor: 'default', opacity: 0.7 }} />
                <span className="badge badge-info" style={{ flexShrink: 0, fontSize: 10 }}>
                  <LockIcon size={10} /> from .env
                </span>
              </div>
            </div>
            <div className="full">
              <label className="label">Verification Code</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={settings.verifyCode} className="input" readOnly
                  style={{ cursor: 'default', opacity: 0.7, maxWidth: 320 }} />
                <span className="badge badge-info" style={{ flexShrink: 0, fontSize: 10 }}>
                  <LockIcon size={10} /> from .env
                </span>
              </div>
              <div className="form-row-hint">Required to publish PRs — always read from environment</div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-header"><FolderIcon size={15} /><h3>GitHub Repository</h3></div>
        <div className="form-card-body">
          <div className="field-group field-group-2">
            <div>
              <label className="label">Owner</label>
              <input value={repoOwner} onChange={e => setRepoOwner(e.target.value)}
                placeholder="VoidX3D" className="input" readOnly={production} />
            </div>
            <div>
              <label className="label">Repository</label>
              <input value={repoName} onChange={e => setRepoName(e.target.value)}
                placeholder="RU_Club_Website" className="input" readOnly={production} />
            </div>
            <div>
              <label className="label"><BranchIcon size={11} style={{ verticalAlign: 'middle' }} /> Branch</label>
              <input value={repoBranch} onChange={e => setRepoBranch(e.target.value)}
                placeholder="main" className="input" style={{ maxWidth: 220 }} readOnly={production} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-card" style={{
        borderColor: env.GITHUB_TOKEN ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        background: env.GITHUB_TOKEN
          ? 'linear-gradient(135deg, rgba(34,197,94,0.03), transparent)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.03), transparent)',
      }}>
        <div className="form-card-header">
          {env.GITHUB_TOKEN
            ? <CheckCircleIcon size={15} style={{ color: 'var(--accent-dark)' }} />
            : <AlertTriangleIcon size={15} style={{ color: 'var(--red)' }} />
          }
          <h3>GitHub Token</h3>
        </div>
        <div className="form-card-body" style={{ padding: '16px 24px' }}>
          {env.GITHUB_TOKEN ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-success">Configured</span>
                <span style={{ fontSize: 12 }}>Token is set via environment variable</span>
              </div>
              <div className="info-banner info-banner-warning" style={{ margin: 0 }}>
                <AlertTriangleIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Security note:</strong> VITE_ prefixed variables are embedded in the client bundle. Anyone using the admin panel can extract this token via DevTools. Use a fine-grained PAT with minimal scopes, or set up a backend proxy for production.</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13 }}>
              Add <code className="badge" style={{ background: 'var(--bg)', fontSize: 11 }}>VITE_GITHUB_TOKEN=your_pat</code> to your <code className="badge" style={{ background: 'var(--bg)', fontSize: 11 }}>.env</code> file to enable publishing.
            </div>
          )}
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-header"><DownloadIcon size={15} /><h3>Data Management</h3></div>
        <div className="form-card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <DownloadIcon size={14} /> Export Backup
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <UploadIcon size={14} /> Import Backup
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileImport} />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              All drafts and settings as JSON.
            </span>
          </div>
        </div>
      </div>

      {/* Branch Management */}
      {env.GITHUB_TOKEN && (
        <BranchManagement repoOwner={repoOwner} repoName={repoName} token={env.GITHUB_TOKEN} />
      )}

      {!production && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-lg" onClick={save} style={{
            background: saved
              ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))'
              : 'linear-gradient(135deg, var(--blue), var(--blue-dark))',
            color: '#fff',
            boxShadow: saved ? '0 4px 14px var(--accent-glow)' : 'none',
            transition: 'all var(--transition)',
          }}>
            {saved ? <CheckCircleIcon size={16} /> : <SaveIcon size={16} />}
            {saved ? 'Saved!' : 'Save Repository Settings'}
          </button>
        </div>
      )}
    </div>
  )
}

function BranchManagement({ repoOwner, repoName, token }: { repoOwner: string; repoName: string; token: string }) {
  const addToast = useStore(s => s.addToast)
  const [branches, setBranches] = useState<BranchStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    if (repoOwner && repoName && token) loadBranches()
  }, [repoOwner, repoName])

  async function loadBranches() {
    setLoading(true)
    try {
      const result = await analyzeBranches(token, repoOwner, repoName, 'main')
      setBranches(result)
    } catch {
      addToast('Could not load branches', 'error')
    }
    setLoading(false)
  }

  async function handleDelete(name: string) {
    setDeleting(name)
    try {
      await deleteBranch(token, repoOwner, repoName, name)
      addToast(`Deleted branch "${name}"`, 'success')
      setBranches(p => p.filter(b => b.name !== name))
    } catch (e) {
      addToast(`Failed to delete "${name}"`, 'error')
    }
    setDeleting(null)
  }

  async function handleCleanup() {
    setCleaning(true)
    try {
      const result = await cleanupStaleBranches(token, repoOwner, repoName, 'main')
      if (result.deleted.length > 0) {
        addToast(`Cleaned up ${result.deleted.length} merged branch${result.deleted.length !== 1 ? 'es' : ''}`, 'success')
        loadBranches()
      } else {
        addToast('No merged branches to clean up', 'info')
      }
    } catch {
      addToast('Cleanup failed', 'error')
    }
    setCleaning(false)
  }

  const mergedCount = branches.filter(b => b.state === 'merged').length
  const staleCount = branches.filter(b => b.state === 'stale').length

  return (
    <div className="form-card" style={{ marginTop: 20 }}>
      <div className="form-card-header">
        <GitPullRequestIcon size={15} />
        <h3>Branch Management</h3>
      </div>
      <div className="form-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {loading ? 'Loading...' : `${branches.length} admin branch${branches.length !== 1 ? 'es' : ''}`}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={loadBranches} disabled={loading}>
              <RefreshIcon size={13} /> Refresh
            </button>
            {mergedCount > 0 && (
              <button className="btn btn-danger btn-sm" onClick={handleCleanup} disabled={cleaning}>
                <TrashIcon size={13} /> Cleanup {mergedCount} Merged
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div>
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 8 }} />)}
          </div>
        ) : branches.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>
            No admin-update branches found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {branches.map(b => {
              const stateStyle = b.state === 'merged' ? { bg: 'var(--purple-light)', color: '#9333ea' }
                : b.state === 'stale' ? { bg: 'var(--red-light)', color: 'var(--red-dark)' }
                : b.state === 'active' && b.prNumber ? { bg: 'var(--accent-light)', color: 'var(--accent-dark)' }
                : { bg: 'var(--amber-light)', color: 'var(--amber-dark)' }
              return (
                <div key={b.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 'var(--radius)',
                  background: 'var(--surface-hover)', fontSize: 12,
                  fontFamily: 'monospace',
                }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.name}
                  </div>
                  <span className="badge" style={{ background: stateStyle.bg, color: stateStyle.color, fontSize: 10 }}>
                    {b.state === 'active' && b.prNumber ? `PR #${b.prNumber}` : b.state}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                    {b.daysOld}d
                  </span>
                  {(b.state === 'stale' || b.state === 'merged') && (
                    <button className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--red)', width: 26, height: 26 }}
                      onClick={() => handleDelete(b.name)}
                      disabled={deleting === b.name}>
                      {deleting === b.name ? '...' : <XIcon size={12} />}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
